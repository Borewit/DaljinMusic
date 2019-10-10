import React , { Component } from 'react'
import { connect } from 'react-redux'
import * as signUpActions from '../../ReduxModules/signUp'
import { bindActionCreators } from 'redux'

import classNames from 'classnames/bind'
import styles from './signUpView.css'
const cn = classNames.bind(styles)

class SignUpView extends Component {

    constructor (props) {
        super(props)
        this.state = {
            verifyPassword : false,
            verifyPasswordCheck : false,
            verifyNickName : false,
            
            verifiedId : '',
            userId : '',
            userPw : '',
            userPwCheck : '',
            userName : '',
        }
    }

    componentDidUpdate (prevProps , prevState) {
        if(this.props.toastMessage !== '') {
            window.alert(this.props.toastMessage)
            this.props.SignUpActions.toastClear()
        }

        if(prevProps.idCheck === false &&  this.props.idCheck === true) {
            this.setState({verifiedId : this.state.userId})
        }
    }

    verifyId = (e) => {
        if(this.state.userId !== this.state.verifiedId) {
            this.props.SignUpActions.changedId()
        }
    }

    verifyPassword = (e) => {
        const regex = /(?=.*\d{1,50})(?=.*[~`!@#$%^&*()\-+=]{1,50})(?=.*[a-zA-Z]{2,50}).{8,50}$/;
        if(regex.test(this.state.userPw)) {
            this.setState({verifyPassword : true })
        }
        else {
            this.setState({verifyPassword : false })
        }

        this.verifyPasswordCheck()
    }

    verifyPasswordCheck = (e) => {
        if(this.state.userPw === this.state.userPwCheck && this.state.userPw !== '' && this.state.userPwCheck !== '') {
            this.setState({verifyPasswordCheck : true})
        }
        else {
            this.setState({verifyPasswordCheck : false})
        }
    }

    verifyNickName = (e) => {
        const regex = /^(?=.*\w{0,8})(?=.*[가-힣]{0,8}).{2,8}$/;
        if(regex.test(this.state.userName)) {
            this.setState({verifyNickName : true})
        }
        else {
            this.setState({verifyNickName : false})
        }
    }

    doIdCheck = (e) => {
        e.preventDefault();
        this.props.SignUpActions.duplIdCheck({ userId : this.state.userId})
    }


    doSingUp = (e) => {
        e.preventDefault()
        const {verifyPassword , verifyPasswordCheck , verifyNickName} = this.state
        if(this.props.idCheck && verifyPassword && verifyPasswordCheck && verifyNickName) {
            console.log('sign up check complete')
            this.props.SignUpActions.fetchSignUp(this.state.verifiedId , this.state.userPw , this.state.userName)
        }
        else {
            console.log('sign up check unlcomplete')
        }
    }

    render () {
        return (
            <div className={cn('viewbody')}>

                <div className={cn('wrap' , 'id-wrap')}>
                    <input type='text' placeholder="아이디" onBlur={this.verifyId} onChange={(e) => this.setState({userId : e.target.value})}/>
                    <input type='button' value="중복확인" onClick={this.doIdCheck} />
                </div>
                <div className={cn('verify' , { 'hidden' : this.props.idCheck})}>
                    <p><i className="fas fa-times"></i> 중복체크를 해주세요.</p>
                </div>


                <div className={cn('wrap')}>
                    <input type='password' placeholder="비밀번호" onBlur={this.verifyPassword} onChange={(e) => {this.setState({ userPw : e.target.value })}} />
                </div>
                <div className={cn('verify' , {'hidden' : this.state.verifyPassword })}>
                    <p><i className="fas fa-times"></i> 영문,숫자,특수문자 포함 8자리 이상</p>
                </div>


                <div className={cn('wrap')}>
                    <input type='password' placeholder="비밀번호확인" onBlur={this.verifyPasswordCheck} onChange={(e) => {this.setState({ userPwCheck : e.target.value })}}/>
                </div>
                <div className={cn('verify' , { 'hidden' : this.state.verifyPasswordCheck })}>
                    <p><i className="fas fa-times"></i> 비밀번호가 다릅니다.</p>
                </div>


                <div className={cn('wrap')}>
                    <input type='text' placeholder="닉네임" onBlur={this.verifyNickName} onChange={(e) => {this.setState({ userName : e.target.value })}}/>
                </div>
                <div className={cn('verify' , { 'hidden' : this.state.verifyNickName })}>
                    <p><i className="fas fa-times"></i> 2자리~8자리 한글,영어,숫자 조합</p>
                </div>
                <div className={cn('wrap' , 'buttons')}>
                    <input type='button' value='가입하기' onClick={this.doSingUp} />
                </div>
            </div>
        )
    }
}


export default connect(
    (state) => ({
        idCheck : state.signUp.idCheck,
        toastMessage : state.signUp.toastMessage
    }),
    (dispatch) => ({
        SignUpActions : bindActionCreators(signUpActions , dispatch)
    })
)(SignUpView)