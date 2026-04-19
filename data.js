// Mock data for the pedagogical dashboard

const BRANDS = ['Matriz Educação', 'QI', 'Apogeu', 'Americano', 'União', 'Unificado'];

const DISCIPLINES = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Artes',
  'Educação Física',
  'Inglês',
];

const STUDENTS = [
  'Ana Clara Silva',
  'Bruno Henrique Souza',
  'Camila Ferreira Costa',
  'Daniel Martins Rocha',
  'Eduarda Lima Pereira',
  'Felipe Santos Gomes',
  'Gabriela Alves Mendes',
  'Henrique Nunes Barros',
  'Isabela Moura Carvalho',
  'João Pedro Ribeiro',
  'Larissa Teixeira Dias',
  'Marcos Vinícius Correia',
];

// Brand averages per discipline (static reference data)
const BRAND_AVERAGES = {
  'Matemática':        7.4,
  'Português':         7.6,
  'Ciências':          7.2,
  'História':          7.8,
  'Geografia':         7.5,
  'Artes':             8.1,
  'Educação Física':   8.4,
  'Inglês':            6.9,
};

// Grupo Raiz (network-wide) averages per discipline
const RAIZ_AVERAGES = {
  'Matemática':        7.1,
  'Português':         7.3,
  'Ciências':          7.0,
  'História':          7.5,
  'Geografia':         7.2,
  'Artes':             7.9,
  'Educação Física':   8.2,
  'Inglês':            6.7,
};

// Frequency per student (percentage, fixed mock)
const STUDENT_FREQUENCY = {
  'Ana Clara Silva':        95,
  'Bruno Henrique Souza':   88,
  'Camila Ferreira Costa':  92,
  'Daniel Martins Rocha':   79,
  'Eduarda Lima Pereira':   97,
  'Felipe Santos Gomes':    85,
  'Gabriela Alves Mendes':  91,
  'Henrique Nunes Barros':  74,
  'Isabela Moura Carvalho': 98,
  'João Pedro Ribeiro':     83,
  'Larissa Teixeira Dias':  90,
  'Marcos Vinícius Correia':87,
};

/**
 * Seeded pseudo-random so scores are deterministic per student+discipline+evaluation.
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getStudentScore(student, discipline, evaluation) {
  const seed = hashStr(student + discipline + evaluation);
  const rng = seededRandom(seed);
  // Scores biased toward 5–10 range
  const base = 4.5 + rng() * 5.5;
  return Math.round(base * 10) / 10;
}

/**
 * Build the full dataset for given filters.
 * Returns { classByDiscipline, studentScores, classFrequency }
 */
function buildData(evaluation) {
  const studentScores = {};
  const disciplineSums = {};
  const disciplineCounts = {};

  DISCIPLINES.forEach(d => {
    disciplineSums[d] = 0;
    disciplineCounts[d] = 0;
  });

  STUDENTS.forEach(student => {
    studentScores[student] = {};
    DISCIPLINES.forEach(disc => {
      const score = getStudentScore(student, disc, evaluation);
      studentScores[student][disc] = score;
      disciplineSums[disc] += score;
      disciplineCounts[disc]++;
    });
  });

  const classByDiscipline = {};
  DISCIPLINES.forEach(d => {
    classByDiscipline[d] = Math.round((disciplineSums[d] / disciplineCounts[d]) * 10) / 10;
  });

  const freqValues = Object.values(STUDENT_FREQUENCY);
  const classFrequency = Math.round(freqValues.reduce((a, b) => a + b, 0) / freqValues.length);

  return { classByDiscipline, studentScores, classFrequency };
}
