const mysql = require("mysql")

const classi = ["1A", "2B", "3C", "4D", "5E"]
const nomi = ["Luca", "Andrea", "Francesco", "Davide", "Simone", "Chiara", "Matteo", "Filippo", "Giacomo", "Salvatore", "Giuseppe", "Antonio", "Giulia", "Marco", "Francesca", "Maria", "Michela", "Rachele", "Martina", "Siria", "Beatrice", "Asia", "Sofia"]
const cognomi = ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Moretti", "Baribieri"]
const materie = [
  { sigla: "ITA", nome: "Italiano" },
  { sigla: "MAT", nome: "Matematica" },
  { sigla: "SCI", nome: "Scienze" },
  { sigla: "LAT", nome: "Latino" },
  { sigla: "ENG", nome: "Inglese" }
]

let studenti = []
let docenti = []

const createPeople = () => {
  let cognomipossibili = cognomi
  for (let i = 0; i < 7; i++) {
    const classe = classi[Math.floor(Math.random() * classi.length)]
    const nome = nomi[Math.floor(Math.random() * nomi.length)]
    const cognome = cognomipossibili[Math.floor(Math.random() * cognomipossibili.length)]
    studenti.push({ classe, cognome, nome })
    cognomipossibili = cognomipossibili.filter(e => e !== cognome)
  }

  for (let i = 0; i < 5; i++) {
    const nome = nomi[Math.floor(Math.random() * nomi.length)]
    const cognome = cognomi[Math.floor(Math.random() * cognomi.length)]
    const numeroMaterie = Math.random() > 0 ? 2 : 1
    let insegnamenti = []
    let materiepossibili = materie
    for (let j = 0; j < numeroMaterie; j ++) {
      const materia = materiepossibili[Math.floor(Math.random() * materiepossibili.length)]
      insegnamenti.push(materia)
      materiepossibili = materiepossibili.filter(e => e.sigla !== materia.sigla)
    }
    docenti.push({ id: i+1, cognome, nome, insegnamenti })
  }
}

const createValutation = () => {
  const studente = studenti[Math.floor(Math.random() * studenti.length)]
  const materia = materie[Math.floor(Math.random() * materie.length)]
  const data = `2021-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 30) + 1}`
  const voto = Math.floor(Math.random() * 10) + 1 
  return {
    classeStudente: studente.classe,
    cognomeStudente: studente.cognome,
    siglaMateria: materia.sigla,
    data, voto
  }
}

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'scuola'
})

db.connect((err) => {
  if (err) {
    console.error(err)
    return
  }
})

const createTables = () => {
  db.query(`CREATE TABLE IF NOT EXISTS Classi (
    classe VARCHAR(255) PRIMARY KEY
  )`)

  db.query(`CREATE TABLE IF NOT EXISTS Studenti (
    classe VARCHAR(255),
    cognome VARCHAR(255), 
    nome VARCHAR(255) NOT NULL,
    PRIMARY KEY (classe, cognome),
    FOREIGN KEY (classe) REFERENCES Classi(classe)
  )`)

  db.query(`CREATE TABLE IF NOT EXISTS Materie (
    sigla VARCHAR(255) PRIMARY KEY,
	  nome VARCHAR(255) NOT NULL
  )`)
  
  db.query(`CREATE TABLE IF NOT EXISTS Docenti (
    cognome VARCHAR(255) NOT NULL,
	  nome VARCHAR(255) NOT NULL,
	  id INT PRIMARY KEY AUTO_INCREMENT
  )`)
  
  db.query(`CREATE TABLE IF NOT EXISTS Insegnamenti (
    idDocente INT,
	  siglaMateria VARCHAR(255),
	  PRIMARY KEY(idDocente, siglaMateria),
    FOREIGN KEY (idDocente) REFERENCES Docenti(id),
    FOREIGN KEY (siglaMateria) REFERENCES Materie(sigla)
  )`)

  db.query(`CREATE TABLE IF NOT EXISTS Valutazioni (
    classeStudente VARCHAR(255),
    cognomeStudente VARCHAR(255),
    siglaMateria VARCHAR(255) NOT NULL,
    data DATE,
    voto INT NOT NULL,
    FOREIGN KEY (siglaMateria) REFERENCES Materie(sigla),
    FOREIGN KEY (classeStudente, cognomeStudente) REFERENCES Studenti(classe, cognome)
  )`)
}

const insertData = () => {
  //inserimento classi
  classi.forEach(e => {
    db.query("INSERT INTO Classi (classe) VALUES (?)", e, (err) => {
      if (err) {
        throw err
      }
    })
  })

  //inserimento studenti
  studenti.forEach(e => {
    db.query("INSERT INTO Studenti (classe, cognome, nome) VALUES (?, ?, ?)", [e.classe, e.cognome, e.nome], (err) => {
      if (err) {
        throw err
      }
    })
  })

  //inserimento materie
  materie.forEach(e => {
    db.query("INSERT INTO Materie (sigla, nome) VALUES (?, ?)", [e.sigla, e.nome], (err) => {
      if (err) {
        throw err
      }
    })
  })

  //inserimento docenti
  docenti.forEach(e => {
    db.query("INSERT INTO Docenti (cognome, nome, id) VALUES (?, ?, ?)", [e.cognome, e.nome, e.id], (err) => {
      if (err) {
        throw err
      }
    })
  })

  //inserimento insegnamenti
  docenti.forEach(e => { 
    e.insegnamenti.forEach(el => {
      db.query("INSERT INTO Insegnamenti (idDocente, siglaMateria) VALUES (?, ?)", [e.id, el.sigla])
    })
  })

  //inserimento valutazioni
  for (let i = 0; i < 10; i++) {
    const valutazione = createValutation()
    db.query("INSERT INTO Valutazioni (classeStudente, cognomeStudente, siglaMateria, data, voto) VALUES (?, ?, ?, ?, ?)", [valutazione.classeStudente, valutazione.cognomeStudente, valutazione.siglaMateria, valutazione.data, valutazione.voto], (err) => {
      if (err) {
        throw err
      }
    })
  }
}

createTables()
createPeople()
insertData()