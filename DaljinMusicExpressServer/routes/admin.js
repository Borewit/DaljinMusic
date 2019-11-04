require('dotenv').config()

const ADMIN_KEY = process.env.ADMIN_KEY

const express = require('express')
const router = express.Router()
const doAsync = require('./async')

const multer = require('multer')

const fs = require('fs')
const { UPLOAD_PATH , ALBUM_IMG_PATH , MUSIC_PATH , ALBUM_IMG_URI } = process.env
const mm = require('music-metadata')

const MusicModel = require('../Database/mongoDB').musicModel
const SingerModel = require('../Database/mongoDB').singerModel
const AlbumModel = require('../Database/mongoDB').albumModel
const IndexModel = require('../Database/mongoDB').indexModel
const CategoryModel = require('../Database/mongoDB').categoryModel

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

router.post('/todayslivesave' , doAsync(async(req , res , next) => {
    const { adminKey , musicId } = req.body
    console.log(`musicId : ${musicId}`)
    const response = {
        message : ''
    }

    if(adminKey === ADMIN_KEY) {
        try {
            const index = await IndexModel.findOne({})
            console.log(index)
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

router.post('/hotandnewsave' , doAsync(async(req , res , next) => {
    const { adminKey , saveList} = req.body;
    const response = {
        message : '',
        ok : false,
    }
    //console.log(list)
    if(adminKey === ADMIN_KEY) {
        try {
            const index = await IndexModel.findOne({})
            for(item of saveList) {
                index.hotAndNew.push({'music' : item.music._id , 'hot' : item.hot , 'new' : item.new})
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

router.post('/deletesavedhotandnew' , doAsync(async(req , res , next) => {
    const { adminKey , index } = req.body;
    const response = {
        message : '',
    }
    if(adminKey === ADMIN_KEY) {
        try {
            const indexDocument = await IndexModel.findOne({})
            indexDocument.hotAndNew.splice(index , 1)
            await indexDocument.save()
            response.message = Dlogger.info('[HOT AND NEW DELETE] 삭제 완료')
        }
        catch(e) {
            response.message = Dlogger.error('[HOT AND NEW DELETE] 데이터베이스 에러')
        }
    }
    else {
        response.message = Dlogger.info('[HOT AND NEW DELETE] 관리자외 설정 불가')
    }
    res.json(response)
}))

router.post('/getcategories' , doAsync(async(req , res , next) => {
    const { adminKey } = req.body;
    const response = {
        message : '',
        categories : []
    }

    if(adminKey === ADMIN_KEY) {
        try {
            const categories = await CategoryModel.find({}).lean()
            response.categories = categories
            response.message = Dlogger.info('[GET CATEGORIES] 조회 완료')
        }
        catch(e) {
            response.message = Dlogger.error('[GET CATEGORIES] 조회 오류')
        }
    }
    else {
        response.message = Dlogger.info('[GET CATEGORIES] 관리자외 사용 불가')
    }
    res.json(response)
}))

router.post('/addcategory' , doAsync(async(req , res , next) => {
    const { adminKey , newCategoryName } = req.body
    const response = {
        message : '',
        categories : []
    }
    if(adminKey === ADMIN_KEY) {
        try {
            await new CategoryModel({
                name : newCategoryName
            }).save()

            const categories = await CategoryModel.find({}).lean()
            response.categories = categories
            response.message = Dlogger.info(`[ADD CATEGORY] 새 카테고리 추가 성공`)
        }
        catch(e) {
            response.message = Dlogger.error(`[ADD CATEGORY] 새 카테고리 추가 실패`)
        }
    }
    else {
        response.message = Dlogger.info(`[ADD CATEGORY] 관리자외 사용 불가`)
    }
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
        message : '',
        complete : []
    }

    const adminKey = JSON.parse(req.body.adminKey)
    const songs = JSON.parse(req.body.songs)
    const singers = JSON.parse(req.body.singers)
    const albums  = JSON.parse(req.body.albums)
    const categories = JSON.parse(req.body.categories)
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
        console.log(`CATEGORIES`)
        console.dir(categories)
        console.log('MUSICFILES')
        console.dir(musicFiles)
        console.log('albumImgFiles')
        console.dir(albumImgFiles)
        */

        //console.log(ALBUM_IMG_URI)

        //파일 길이만큼 반복
        for(let i = 0 ; i < musicFiles.length ; i++) {
            try {
                //음악 파일 옮기기
                const musicOldPath = `${UPLOAD_PATH}/${musicFiles[i].filename}`
                const musicNewPath = `${MUSIC_PATH}/${musicFiles[i].filename}`
                fs.renameSync(musicOldPath , musicNewPath)

                //앨범사진 파일 옮기기
                let albumImgUri = ''
                if(albums[i].albumImgIndex !== -1) {
                    const albumOldPath = `${UPLOAD_PATH}/${albumImgFiles[albums[i].albumImgIndex].filename}`
                    const albumNewPath = `${ALBUM_IMG_PATH}/${albumImgFiles[albums[i].albumImgIndex].filename}`
                    albumImgUri = `${ALBUM_IMG_URI}/${albumImgFiles[albums[i].albumImgIndex].filename}`
                    fs.renameSync(albumOldPath , albumNewPath)
                }

                //가수 저장
                let singerId = ''
                if(singers[i].singerDatabaseId !== '') {
                    singerId = singers[i].singerDatabaseId
                }
                else {
                    const singerFindResult = await SingerModel.findOne({'name' : singers[i].name})
                    if(singerFindResult === null) {
                        const singerModel = new SingerModel({
                            'name' : singers[i].name
                        })
                        const singerDoc = await singerModel.save()
                        singerId = singerDoc._id
                    }
                    else {
                        singerId = singerFindResult._id
                    }
                }



                //앨범 저장
                let albumId = null
                if(albums[i].albumDatabaseId !== '') {
                    albumId = albums[i].albumDatabaseId
                }
                else {
                    let albumModel = null

                    //앨범 이름 없을때
                    if(albums[i].name === '' || albums[i].name === null) {
                        const albumFindResult = await AlbumModel.findOne({'name' : null , 'singer' : singerId})
                        if(albumFindResult === null) {
                            albumModel = new AlbumModel({
                                'singer' : singerId
                            })
                            const albumDoc = await albumModel.save()
                            albumId = albumDoc._id
                        }
                        else {
                            albumId = albumFindResult._id
                        }
                    }
                    //앨범 이름 있을때
                    else {
                        //앨범 사진 없을때
                        const albumFindResult = await AlbumModel.findOne({'name' : albums[i].name , 'singer' : singerId})
                        if(albumFindResult === null) {
                            if(albumImgUri === '' || albumImgUri === null) {
                                albumModel = new AlbumModel({
                                    'name' : albums[i].name,
                                    'singer' : singerId,
                                })
                            }
                            else {
                                albumModel = new AlbumModel({
                                    'name' : albums[i].name,
                                    'albumImgUri' : albumImgUri,
                                    'singer' : singerId,
                                })
                            }
                            const albumDoc = await albumModel.save()
                            albumId = albumDoc._id
                        }
                        else {
                            albumId = albumFindResult._id
                        }
                    }


                }

            const metadata = await mm.parseFile(musicNewPath, {duration: true})

            //음악 저장
            const musicModel = new MusicModel({
                song : songs[i].name,
                singer : singerId,
                album : albumId,
                filePath : musicNewPath,
                playTime : metadata.format.duration,
                uploadDate : getTime(),
                totalPlayCount : 0,
                weekPlayCount : 0,
                dayPlayCount : 0,
                category : categories[i].category
            })

            musicModel.save()
            console.log('업로드 완료')
            response.complete.push(true)
        }
        catch(err) {
            console.error(err)
            console.log('업로드 실패')
            response.complete.push(false)
        }
    }
    else {
        response.message = '관리자외 업로드 불가'
    }


    res.json(response)

}))



module.exports = router
