import Vue from 'vue'
import io from 'socket.io-client'

const socket = io('http://203.255.92.192:8080/')


const SocketPlugin = {
  install(vue){
    vue.mixin({
    });

    vue.prototype.$socket = socket
  }
}

Vue.use(SocketPlugin)
