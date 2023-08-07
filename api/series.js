const express = require('express')
const sqlite3 = require('sqlite3')
const issuesRouter = require('./issues')

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

const seriesRouter = express.Router()
seriesRouter.use('/:seriesId/issues', issuesRouter)

const checkValidSeries = (req, res, next) => {
    const series = req.body.series
    if(!series.name || !series.description) {
        res.sendStatus(400)
    } else {
        next()
    }
}

seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get('SELECT * FROM Series WHERE id = $id', {
        $id: Number(id)
    }, (err, series) => {
        if (err) {
            next(err)
        } else if (series) {
            req.series = series
            next()
        } else {
            res.sendStatus(404)
        }
    })
})

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, series) => {
        if(err) {
            next(err)
        } else {
            res.status(200).json({series})
        }
    })
})

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series})
})

seriesRouter.post('/', checkValidSeries, (req, res, next) => {
    const series = req.body.series
    db.run('INSERT INTO Series (name, description) VALUES ($name, $description)', {
        $name: series.name,
        $description: series.description
    }, function (err) {
        if(err) {
            next(err)
        } else {
            db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, series) => {
                if(err) {
                    next(err)
                } else {
                    res.status(201).json({series})
                }
            })
        }
    })
})

seriesRouter.put('/:seriesId', checkValidSeries, (req, res, next) => {
    const series = req.body.series
    db.run('UPDATE Series SET name = $name, description = $description WHERE id = $id', {
        $name: series.name,
        $description: series.description,
        $id: req.params.seriesId
    }, function (err) {
        if(err) {
            next(err)
        } else {
            db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, series) => {
                if(err) {
                    next(err)
                } else {
                    res.status(200).json({series})
                }
            })
        }
    })
})

seriesRouter.delete('/:seriesId', (req, res, next) => {
    db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`, (err, issue) => {
        if(err) {
            next(err)
        } else if(issue) {
            res.sendStatus(400)
        } else {
            db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, function (err) {
                if(err) {
                    next(err)
                } else {
                    res.sendStatus(204)
                }
            })
        }
    })
})

module.exports = seriesRouter;