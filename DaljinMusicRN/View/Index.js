import React, { Component } from 'react'

import { View , Text, StyleSheet, Platform, StatusBar } from 'react-native'

import BottomNavigator from './BottomNavigator'
import LoadingView from './LoadingView';


class Index extends Component {


    render () {
        return (
            <View style={styles.container}>
                <BottomNavigator />
                <LoadingView />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container : {
        flex : 1,
        ...Platform.select({
            ios : {
                paddingTop : 20
            },
            android : {
                paddingTop : StatusBar.currentHeight
            }
        })
    }
})

export default Index;