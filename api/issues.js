const express = require('express')
const sqlite3 = require('sqlite3')

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

const issuesRouter = express.Router({mergeParams: true})

const checkValidIssue = (req, res, next) => {
    const issue = req.body.issue

    db.get(`SELECT * FROM Artist WHERE id = ${issue.artistId}`, (err, artist) => {
        if (err) {
            next(err)
        } else if (!artist || !issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
            res.sendStatus(400)

        } else {
            next()
        }
    })
}

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get('SELECT * FROM Issue WHERE id = $id', {
        $id: id
    }, (err, issue) => {
        if (err) {
            next(err)
        } else if (issue) {
            req.issue = issue
            next()
        } else {
            res.sendStatus(404)
        }
    })
})


issuesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId', {
        $seriesId: req.params.seriesId
    }, (err, issues) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({issues})
        }
    })
})

issuesRouter.post('/', checkValidIssue, (req, res, next) => {
    const issue = req.body.issue
    db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) 
VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`, {
        $name: issue.name,
        $issueNumber: issue.issueNumber,
        $publicationDate: issue.publicationDate,
        $artistId: issue.artistId,
        $seriesId: req.params.seriesId
    }, function (err) {
        if (err) {
            next(err)
        } else {
            db.get('SELECT * FROM Issue WHERE id = $id', {
                $id: this.lastID
            }, (err, issue) => {
                if (err) {
                    next(err)
                } else {
                    res.status(201).json({issue})
                }
            })
        }
    })
})

issuesRouter.put('/:issueId', checkValidIssue, (req, res, next) => {
    const issue = req.body.issue
    db.run('UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId, series_id = $seriesId WHERE id = $id', {
        $name: issue.name,
        $issueNumber: issue.issueNumber,
        $publicationDate: issue.publicationDate,
        $artistId: issue.artistId,
        $seriesId: req.params.seriesId,
        $id: req.params.issueId
    }, function (err) {
        if(err) {
            next(err)
        } else {
            db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, issue) => {
                if(err) {
                    next(err)
                } else {
                    res.status(200).json({issue})
                }
            })
        }
    })
})

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, function (err) {
        if(err) {
            next(err)
        } else {
            res.sendStatus(204)
        }
    })
})

module.exports = issuesRouter;