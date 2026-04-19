'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  brand:      'Matriz Educação',
  unidade:    'Unidade Norte',
  segmento:   'Ensino Fundamental I',
  turma:      '5º A',
  bimestres:  ['1º Bimestre'],
  avaliacao:  'Avaliação 1',
  alunos:     [],          // empty = all
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function level(score) {
  if (score < 6.0) return 'critico';
  if (score < 8.0) return 'medio';
  return 'excelencia';
}

function levelLabel(score) {
  if (score < 6.0) return 'Crítico';
  if (score < 8.0) return 'Médio';
  return 'Excelência';
}

function fmt(n) {
  return Number(n).toFixed(1).replace('.', ',');
}

function avgOf(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Dropdown logic ──────────────────────────────────────────────────────────
function initDropdowns() {
  document.querySelectorAll('.dropdown').forEach(dd => {
    const toggle = dd.querySelector('.dropdown__toggle');
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown.open').forEach(o => {
        if (o !== dd) o.classList.remove('open');
      });
      dd.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(o => o.classList.remove('open'));
  });

  document.querySelectorAll('.dropdown__menu').forEach(menu => {
    menu.addEventListener('click', e => e.stopPropagation());
  });

  // Radio dropdowns
  ['unidade', 'segmento', 'turma', 'avaliacao'].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        state[name] = radio.value;
        syncToggleLabel(radio.closest('.dropdown'));
        render();
      });
    });
  });

  // Bimestre checkboxes
  const ddBimestre = document.getElementById('dd-bimestre');
  ddBimestre.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.bimestres = [...ddBimestre.querySelectorAll('input:checked')].map(c => c.value);
      if (!state.bimestres.length) {
        cb.checked = true;
        state.bimestres = [cb.value];
      }
      syncToggleLabel(ddBimestre);
      render();
    });
  });

  // Aluno checkboxes (populated dynamically)
  populateAlunoFilter();

  // Sync all toggle labels on init
  document.querySelectorAll('.dropdown').forEach(syncToggleLabel);
}

function populateAlunoFilter() {
  const menu = document.querySelector('#dd-aluno .dropdown__menu');
  menu.innerHTML = STUDENTS.map(s =>
    `<label><input type="checkbox" value="${s}" /> ${s}</label>`
  ).join('');

  menu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.alunos = [...menu.querySelectorAll('input:checked')].map(c => c.value);
      syncToggleLabel(document.getElementById('dd-aluno'));
      render();
    });
  });
}

function syncToggleLabel(dd) {
  const toggle = dd.querySelector('.dropdown__toggle');
  const checked = [...dd.querySelectorAll('input:checked')];
  if (!checked.length) {
    toggle.textContent = 'Selecionar';
    return;
  }
  if (checked.length === 1) {
    toggle.textContent = checked[0].value;
  } else {
    toggle.textContent = `${checked.length} selecionados`;
  }
}

// ─── Brand bar ───────────────────────────────────────────────────────────────
function initBrandBar() {
  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.brand = btn.dataset.brand;
      render();
    });
  });
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  const { avaliacao, alunos } = state;
  const isBimestral = avaliacao === 'Média Bimestral';

  const { classByDiscipline, studentScores, classFrequency } = buildData(avaliacao);

  const activeStudents = alunos.length ? alunos : STUDENTS;

  // ── KPIs ────────────────────────────────────────────────────────────────
  const classAvgAll = avgOf(DISCIPLINES.map(d => classByDiscipline[d]));
  const brandAvgAll = avgOf(Object.values(BRAND_AVERAGES));
  const raizAvgAll  = avgOf(Object.values(RAIZ_AVERAGES));

  const elTurma = document.getElementById('kpi-media-turma');
  const elSub   = document.getElementById('kpi-media-turma-sub');
  elTurma.textContent = fmt(classAvgAll);
  elTurma.className = 'kpi-card__value level-' + level(classAvgAll);

  const diff = classAvgAll - brandAvgAll;
  elSub.textContent = (diff >= 0 ? '+' : '') + fmt(diff) + ' vs Marca';
  elSub.className = 'kpi-card__sub ' + (diff >= 0 ? 'positive' : 'negative');

  document.getElementById('kpi-media-marca').textContent = fmt(brandAvgAll);
  document.getElementById('kpi-media-raiz').textContent  = fmt(raizAvgAll);
  document.getElementById('kpi-frequencia').textContent  = classFrequency + '%';

  // ── Critical block ───────────────────────────────────────────────────────
  const criticalBlock = document.getElementById('critical-block');
  if (isBimestral) {
    criticalBlock.style.display = '';
    const criticalList = document.getElementById('critical-list');
    const criticalStudents = activeStudents.filter(s => {
      const avg = avgOf(DISCIPLINES.map(d => studentScores[s][d]));
      return avg < 6.0;
    });

    if (criticalStudents.length) {
      criticalList.innerHTML = criticalStudents.map(s => {
        const avg = avgOf(DISCIPLINES.map(d => studentScores[s][d]));
        const critDiscs = DISCIPLINES.filter(d => studentScores[s][d] < 6.0);
        return `<div class="critical-student">
          <span class="critical-student__name">${s}</span>
          <span class="critical-student__avg">Média: ${fmt(avg)}</span>
          <span class="critical-student__discs">${critDiscs.join(', ')}</span>
        </div>`;
      }).join('');
    } else {
      criticalList.innerHTML = '<p class="no-critical">Nenhum aluno em nível crítico.</p>';
    }
  } else {
    criticalBlock.style.display = 'none';
  }

  // ── Discipline table ─────────────────────────────────────────────────────
  const tbody = document.getElementById('discipline-tbody');
  tbody.innerHTML = DISCIPLINES.map(disc => {
    const mt = classByDiscipline[disc];
    const mm = BRAND_AVERAGES[disc];
    const mr = RAIZ_AVERAGES[disc];
    const lv = level(mt);
    return `<tr>
      <td>${disc}</td>
      <td><span class="badge badge--${lv}">${fmt(mt)}</span></td>
      <td>${fmt(mm)}</td>
      <td>${fmt(mr)}</td>
    </tr>`;
  }).join('');

  // ── Student cards ────────────────────────────────────────────────────────
  const grid = document.getElementById('students-grid');
  grid.innerHTML = activeStudents.map(student => {
    const scores = studentScores[student];
    const freq   = STUDENT_FREQUENCY[student];
    const avg    = avgOf(DISCIPLINES.map(d => scores[d]));

    const rows = DISCIPLINES.map(disc => {
      const note = scores[disc];
      const lv   = level(note);
      return `<tr>
        <td>${disc}</td>
        <td class="level-${lv}">${fmt(note)}</td>
        <td><span class="badge badge--${lv} badge--sm">${levelLabel(note)}</span></td>
        <td>${fmt(classByDiscipline[disc])}</td>
        <td>${fmt(BRAND_AVERAGES[disc])}</td>
        <td>${fmt(RAIZ_AVERAGES[disc])}</td>
      </tr>`;
    }).join('');

    return `<div class="student-card">
      <div class="student-card__header">
        <span class="student-card__name">${student}</span>
        <div class="student-card__meta">
          <span>Média: <strong class="level-${level(avg)}">${fmt(avg)}</strong></span>
          <span>Frequência: <strong>${freq}%</strong></span>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table data-table--student">
          <thead>
            <tr>
              <th>Disciplina</th>
              <th>Nota</th>
              <th>Nível</th>
              <th>Média Turma</th>
              <th>Média Marca</th>
              <th>Média Raiz</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBrandBar();
  initDropdowns();
  render();
});
