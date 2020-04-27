//express is a node.js library that allows to setup the backend of the application
const express = require('express')
const app = express()
//dotenv enables elegant storage of environmental (security sensitive) variables to
//be stored in a file for development.
require('dotenv').config()

//mongoose is an easy to use library to interact with the MongoDB database service
const mongoose = require('mongoose')

//imports a model for that define the structure, form and location of database documents (entries)
const Person = require('./models/note')

//middleware (.use) is set-up prior to any routes in order to process/format requests

//CORS allows to make HTTP requests outside of root domain
const cors = require('cors')
//cors middleware
app.use(cors())
//json-parser takes the JSON data of the request, transforms to JS object and attaches it as a body
//property to the request object. Otherwise, request.body would be undefined.
app.use(express.json())
//static build middleware specified that the front-end build version index.html is rendered at the root
app.use(express.static('build'))

//middleware for the deprecated findByIdAndUpdate
mongoose.set('useFindAndModify', false);

//following are the various routes the request will be processed

app.get('/api/persons', (request, response) => {
  Person.find({}).then(entries => {
    response.json(entries.map(entry => entry.toJSON()))
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(function (note) {
      console.log(response.json(note))
      return note ? response.json(note.toJSON()) : response.status(404).end();
    })
    .catch(error => {
      console.log(error)
      next(error)
    })
})

app.get('/info', (request, response) => {

  Person.countDocuments({}).then(count => {
    console.log('count:', count)
    response.send(
      `<div>
      <p>Phonebook has info for ${count} people.</p>
      <p>${new Date()}</p>
      </div>`
    )
    })
      .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({
      error: 'name entry missing'
    })
  } else if (!body.number) {
    return response.status(400).json({
      error: 'number entry missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
    id: parseInt(Math.random() * 10000, 10)
  })

  person.save().then(savedNote => response.json(savedNote.toJSON()))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedNote => response.json(updatedNote.toJSON()))
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
//error handling middleware must be positioned at the end of routes.
//otherwise the request will be processed by the error handler,
//program will end without going through the routes.
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

