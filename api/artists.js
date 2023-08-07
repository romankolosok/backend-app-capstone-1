const express = require('express')
const sqlite3 = require('sqlite3')

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

const artistsRouter = express.Router()

const checkValidArtist = (req, res, next) => {
    const artist = req.body.artist
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.sendStatus(400)
    } else {
        next()
    }
}

artistsRouter.param('artistId', (req, res, next, id) => {
    db.get('SELECT * FROM Artist WHERE id = $id', {
        $id: Number(id)
    }, (err, artist) => {
        if (err) {
            next(err)
        } else if (artist) {
            req.artist = artist
            next()
        } else {
            res.sendStatus(404)
        }
    })
})

artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, artists) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({artists});
        }
    })
})

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({artist: req.artist})
})

artistsRouter.post('/', checkValidArtist, (req, res, next) => {
    const artist = req.body.artist
    db.run('INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $DOB, $biography, $isEmployed)', {
        $name: artist.name,
        $DOB: artist.dateOfBirth,
        $biography: artist.biography,
        $isEmployed: artist.isCurrentlyEmployed || 1
    }, function (err) {
        if (err) {
            next(err)
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', {
                $id: this.lastID
            }, (err, artist) => {
                if (err) {
                    next(err)
                } else {
                    res.status(201).json({artist})
                }
            })
        }
    })
})

artistsRouter.put('/:artistId', checkValidArtist, (req, res, next) => {
    const artist = req.body.artist
    db.run('UPDATE Artist SET name = $name, date_of_birth = $DOB, biography = $biography, is_currently_employed = $isEmployed WHERE id = $id', {
        $name: artist.name,
        $DOB: artist.dateOfBirth,
        $biography: artist.biography,
        $isEmployed: artist.isCurrentlyEmployed || 1,
        $id: req.params.artistId
    }, function (err) {
        if (err) {
            next(err)
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', {
                $id: req.params.artistId
            }, (err, artist) => {
                if (err) {
                    next(err)
                } else {
                    res.status(200).json({artist})
                }
            })
        }
    })
})

artistsRouter.delete('/:artistId',(req, res, next) => {
    db.run('UPDATE Artist SET is_currently_employed = 0 WHERE id = $id', {
        $id: req.params.artistId
    }, function (err) {
        if(err) {
            next(err)
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', {
                $id: req.params.artistId
            }, (err, artist) => {
                if(err) {
                    next(err)
                } else {
                    res.status(200).send({artist})
                }
            })
        }
    })
})

module.exports = artistsRouter;