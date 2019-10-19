import React , { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as myMusicActions from '../../../ReduxModules/myMusic'

import classNames from 'classnames/bind'
import styles from './modal.css'
const cn = classNames.bind(styles)

export const MODAL_SELECTOR = {
    DELETE : 1,
    MAKELIST : 2,
    GETLIST : 4,
    UPLOAD : 8
};

const button = (value , key) => (
    <div className={cn('mymusic-modal-button')} key={`button${key}`}>
        <p>{value}</p>
    </div>
)

const text = (value , key) => (
    <div className={cn('mymusic-modal-text')} key={`text${key}`}>
        <p>{value}</p>
    </div>
)

const inputText = (placeholder , key) => (
    <div className={cn('mymusic-modal-inputtext')} key={`inputtext${key}`}>
        <input type='text' placeholder={placeholder} />
    </div>
)

const inputFileFinder = (onFileChange , key) => (
    <div className={cn('mymusic-modal-inputfile' , 'mymusic-modal-button')} key={`inputFileFinder${key}`}>
        <input type='file' id='fileupload' className={cn('mymusic-upload-button')} onChange={onFileChange} multiple/>
        <label htmlFor='fileupload' className={cn('mymusic-upload-label')}><p>찾아보기</p></label>
    </div>
)

const uploadList = (uploadItems = [] , key) => (
    <div className={cn('mymusic-modal-uploadlist')} key={`uploadList${key}`}>
        {uploadItems}
    </div>
)

const uploadListItem = (item, key) => (
    <div className={cn('mymusic-modal-uploadlist-item')} key={`uploadListItem${key}`}>
        <div className={cn('mymusic-modal-uploadlist-item-first')}>
            <p>{item.name}</p>
        </div>
        <div className={cn('mymusic-modal-uploadlist-item-second')}>
            <p>{fileSizeChanger(item.size)}</p>
        </div>
        <div className={cn('mymusic-modal-uploadlist-item-third')}>
            <p>X</p>
        </div>
    </div>
)

const fileSizeChanger = (size , offset = 0) => {
    if(size > 1024) {
        return fileSizeChanger(size / 1024 , offset + 1)
    }
    else {
        return `${size.toFixed(2)}${
                        offset === 0 ? 'Byte' : 
                        offset === 1 ? 'KB' :
                        offset === 2 ? 'MB' :
                        offset === 3 ? 'GB' :
                        'TB'}`
    }
}

class Modal extends Component {
    constructor(props) {
        super(props)

        this.state = {
            uploadItems : [],
            fileList : null
        }
    }

    onFileChange = (e) => {
        this.setState({fileList : e.target.files , uploadItems : Array.from(e.target.files)})
    }

    onFileUpload = () => {
        this.props.MyMusicActions.modalFetchUploadFile(this.state.fileList)
    }
    
    render () {
        let title = null;
        let content = [];
        let buttons = [];
        switch(this.props.mode) {
            case MODAL_SELECTOR.DELETE : 
                title = '삭제'
                content.push(text('정말 삭제하시겠습니까?' , content.length))
                buttons.push(button('네' , buttons.length))
                break;
            
            case MODAL_SELECTOR.MAKELIST : 
                title = '새 리스트 만들기'
                content.push(inputText('리스트 이름'))
                buttons.push(button('만들기' , buttons.length))
                break;
            
            case MODAL_SELECTOR.GETLIST : 
                title = '가져오기'
                content.push(inputText('아이디' , content.length))
                content.push(inputText('리스트이름' , content.length))
                buttons.push(button('가져오기' , buttons.length))
                break;

            case MODAL_SELECTOR.UPLOAD : 
                title = '업로드'

                content.push(uploadList(this.state.uploadItems.map((value , index ) => (uploadListItem(value , index))) , content.length))
                buttons.push(inputFileFinder(this.onFileChange , content.length))
                buttons.push(button('완료' , buttons.length))
                break;
            
            default :

                break;
        }

        return (
                <div className={cn('modal')}>
                    <div className={cn('modal-title')}>
                        <div className={cn('modal-title-text')}>{title}</div>
                        <div className={cn('modal-title-buttons')} onClick={() => { this.props.onToggleModal() }}>
                            <div>
                                <p>X</p>
                            </div>
                        </div>
                    </div>
                    <div className={cn('modal-content')}>
                        {content}
                    </div>
                    <div className={cn('modal-buttons')}>
                        {buttons}
                    </div>
                </div>
        )
    }
}

export default connect(
    (state) => ({
        uploadProgress : state.mymusic.uploadProgress
    }),
    (dispatch) => ({
        MyMusicActions : bindActionCreators(myMusicActions , dispatch)
    })
)(Modal)