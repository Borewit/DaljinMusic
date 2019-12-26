require('dotenv').config()

const ADMIN_KEY = process.env.ADMIN_KEY

const express = require('express')
const router = express.Router()
const doAsync = require('./async')

const multer = require('multer')

const fs = require('fs')
const { UPLOAD_PATH , ALBUM_IMG_PATH , MUSIC_PATH , ALBUM_IMG_URI } = process.env
const { getAudioDurationInSeconds } = require('get-audio-duration')

const MusicModel = require('../Database/mongoDB').musicModel
const SingerModel = require('../Database/mongoDB').singerModel
const AlbumModel = require('../Database/mongoDB').albumModel
const IndexModel = require('../Database/mongoDB').indexModel

const { getTime  , isNUW} = require('../util')
const Dlogger = require('../Dlogger')

router.post('/validate' , doAsync(async(req , res , next) => {
    const { password } = req.body
    const response = {
        message : '',
        adminKey : '',
        isAdmin : false,
    }

    if(password == '1234') {
        response.message = 'Admin 검증 완료'
        response.adminKey = ADMIN_KEY
        response.isAdmin = true
    }
    else {
        response.message = 'Admin 검증 실패'
    }
    Dlogger.info(response.message)
    res.json(response)
}))

router.post('/getallmusics' , doAsync(async(req , res , next) => {
    const { adminKey } = req.body
    const response = {
        message : '',
        searchList : [],
    }

    if(adminKey === ADMIN_KEY) {
        try {
            response.searchList = await MusicModel.find().populate('singer album').lean()
            response.message = '[전체 음악]조회 완료'
        }
        catch(e) {
            Dlogger.error(e)
            response.message = '[전체 음악]데이터베이스 오류'
        }
    }
    else {
        response.message = "[전체음악] 관리자이외 접근불가"
    }
    Dlogger.info(response.message)
    res.json(response)
}))

router.post('/settodayslive' , doAsync(async(req , res , next) => {
    const { adminKey , musicId } = req.body
    const response = {
        message : ''
    }

    if(adminKey === ADMIN_KEY) {
        try {
            const index = await IndexModel.findOne({})
            index.todaysLive = musicId
            await index.save()
            response.message = "[오늘의 라이브]저장 완료"
        }
        catch(e) {
            Dlogger.error(e)
            response.message = "[오늘의 라이브]저장 에러"
        }
    }
    else {
        response.message = "[오늘의 라이브] 관리자외 실행불가"
    }
    Dlogger.info(response.message)
    res.json(response)
}))

router.post('/sethotandnew' , doAsync(async(req , res , next) => {
    const { adminKey , list} = req.body;
    const response = {
        message : '',
        ok : false,
    }
    //console.log(list)
    if(adminKey === ADMIN_KEY) {
        try {
            const index = await IndexModel.findOne({})
            for(item of list) {
                index.hotAndNew.push({'music' : item.musicId , 'hot' : item.hot , 'new' : item.new})
            }

            await index.save()
            response.message = '[HOT AND NEW]저장 완료'
            response.ok = true
        }
        catch(e) {
            Dlogger.error(e)
            response.message = '[HOT AND NEW]데이터베이스 에러'
        }
    }
    else {
        response.message = '[HOT AND NEW]관리자외 설정 불가'
    }
    Dlogger.info(response.message)
    res.json(response)
}))


const upload = multer({
    storage : multer.diskStorage({
        destination : function(req , file , cb) {
            cb(null , UPLOAD_PATH)
        },
        filename :  function(req,  file , cb) {
            const ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1 , file.originalname.length)
            setTimeout(function(){cb(null , `${new Date().getTime()}.${ext}`)} , 10)
        }
    })
})

router.post('/musicupload' , upload.fields( [ { name: 'musicFiles' } , { name : 'albumImgFiles' } ] ) , doAsync(async (req , res , next) => {
    
    const response = {
        message : ''
    }

    const adminKey = JSON.parse(req.body.adminKey)
    const songs = JSON.parse(req.body.songs)
    const singers = JSON.parse(req.body.singers)
    const albums  = JSON.parse(req.body.albums)
    const musicFiles = req.files['musicFiles']
    const albumImgFiles = req.files['albumImgFiles']

    if(ADMIN_KEY == adminKey) {
        /*
        console.log(`SONGS`)
        console.dir(songs)
        console.log(`SINGERS`)
        console.dir(singers)
        console.log(`ALBUMS`)
        console.dir(albums)
        console.log('MUSICFILES')
        console.dir(musicFiles)
        */
        
        console.log(ALBUM_IMG_URI)

        //파일 길이만큼 반복
        for(let i = 0 ; i < musicFiles.length ; i++) {
            try {
                //음악 파일 옮기기
                const musicOldPath = `${UPLOAD_PATH}/${musicFiles[i].filename}`
                const musicNewPath = `${MUSIC_PATH}/${musicFiles[i].filename}`
                fs.renameSync(musicOldPath , musicNewPath)

                //앨범사진 파일 옮기기
                let albumImgUri = ''
                if(albums[i].isThere) {
                    const albumOldPath = `${UPLOAD_PATH}/${albumImgFiles[albums[i].index].filename}`
                    const albumNewPath = `${ALBUM_IMG_PATH}/${albumImgFiles[albums[i].index].filename}`
                    albumImgUri = `${ALBUM_IMG_URI}/${albumImgFiles[albums[i].index].filename}`
                    fs.renameSync(albumOldPath , albumNewPath)
                }

                //가수 저장
                let singerId = ''
                if(singers[i]._id !== '') {
                    singerId = singers[i]._id
                }
                else {
                    const singerModel = new SingerModel({
                        'name' : singers[i].name
                    })
                    const singerDoc = await singerModel.save()
                    singerId = singerDoc._id
                }
                
                
                
                //앨범 저장
                let albumId = ''
                console.dir(albums[i])
                if(albums[i]._id !== '') {
                    albumId = albums[i]._id
                }
                else if(albums[i].name !== '') {
                    let albumModel = null
                    if(albumImgUri == '')
                        albumModel = new AlbumModel({
                            'name' : albums[i].name,
                        })
                    else
                        albumModel = new AlbumModel({
                            'name' : albums[i].name,
                            'albumImgUri' : albumImgUri,
                        })
                    
                    const albumDoc = await albumModel.save()
                    albumId = albumDoc._id
                }



                //음악 저장
                const musicModel = new MusicModel({
                    song : songs[i].name,
                    singer : singerId,
                    album : albumId,
                    filePath : musicNewPath,
                    duration : await getAudioDurationInSeconds(musicNewPath),
                    uploadDate : getTime(),
                    totalPlayCount : 0,
                    weekPlayCount : 0,
                    dayPlayCount : 0,
                })
                musicModel.save()

                console.log('업로드 완료')
                response.message = '업로드 완료'
            }
            catch(err) {
                console.error(err)
                console.log('업로드 실패')
                response.message = '업로드 실패'
            }
        }
    }
    else {
        response.message = '관리자외 업로드 불가'
    }
    

    res.json(response)
}))



module.exports = router