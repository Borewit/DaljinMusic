import { createAction , handleActions } from 'redux-actions'
import { put , call , takeLatest } from 'redux-saga/effects'
import Config from '../config'

export const FETCH_GET_MYMUSIC = 'mymusic/GETFETCH'
export const fetchMyMusic = createAction(FETCH_GET_MYMUSIC)

export const ACCEPT_GET_MYMUSIC = 'mymusic/GETACCEPT'
export const acceptMyMusic = createAction(ACCEPT_GET_MYMUSIC)

export const ABORT_GET_MYMUSIC = 'mymusic/GETABORT'
export const abortMyMusic = createAction(ABORT_GET_MYMUSIC)

export const SELECT_LIST = 'mymusic/SELECTLIST'
export const selectList = createAction(SELECT_LIST)

export const TOGGLE_CHECKED = 'mymusic/TOGGLECHECKED'
export const toggleChecked = createAction(TOGGLE_CHECKED)

const myMusicInitialState = {
    myMusicList : [{
        listName: '',
        items : []
    }],
    curSelectList : 0
    /* 
    //리스트 구조
    {
        listName : '',
        items : [
            {
                id : '',
                album : '',
                albumImgUri : '',
                song : '',
                singer : '',
                time : '',
                chcked : '' // 클라이언트 전용
            }
        ]
    }
    */
}

export const myMusicReducer = handleActions({
    [ACCEPT_GET_MYMUSIC] : (state , action) => {
        const newState = { ...state }
        const List = action.payload

        newState.myMusicList = [];

        for(let i = 0 ; i < List.length ; i++) {
            newState.myMusicList.push(List[i])
            for(let j = 0 ;  j < List[i].items.length ; j++) {
                newState.myMusicList[i].checked = false
            }    
        }
        return newState
    },
    [ABORT_GET_MYMUSIC] : (state , action) => {
        const newState = { ...myMusicInitialState } 
        return newState
    },
    [SELECT_LIST] : (state , action) => {
        const newState = { ...state }
        newState.curSelectList = action.payload.selectedList
        return newState
    },
    [TOGGLE_CHECKED] : (state , action) => {
        const newState = { ...state }
        const item = action.payload

        const foundItem = newState.myMusicList[newState.curSelectList].items.find((value) => ( value.id === item.id ))
        if(foundItem !== undefined) {
            foundItem.checked = !foundItem.checked
        }
        return newState
    }
} , myMusicInitialState)


function* fetchGetSaga(action) {
    const request = {
        body : JSON.stringify(action.payload),
        headers : {
            'Content-Type' : 'application/json'
        },
        method : 'POST'
    }

    try 
    {
        const response = yield call(fetch , `${Config.SERVER}/mymusic` , request)
        
        if(response.ok) {
            yield put({type: ACCEPT_GET_MYMUSIC , payload : yield call([response , 'json'])})
        }
        else {
            throw new Error('aborted')
        }
    }
    catch(error) {
        yield put({type : ABORT_GET_MYMUSIC})
    }
}

export function* myMusicSaga() {
    yield takeLatest(FETCH_GET_MYMUSIC , fetchGetSaga)
}