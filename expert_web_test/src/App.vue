<template>
<div id="app">
  <v-app>
    <v-navigation-drawer v-model="primaryDrawer.model"
                         :clipped="primaryDrawer.clipped"
                         :floating="primaryDrawer.floating"
                         :mini-variant="getisMini"
                         :permanent="primaryDrawer.type === 'permanent'"
                         :temporary="primaryDrawer.type === 'temporary'"
                         app
                         overflow>
      <v-list>

        <v-list-item link v-for="(menu, i) in menus" :to="menu.href" active-class="primary--text menu" :key="i">
          <v-list-item-icon>
            <v-icon> {{menu.icon}}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title >{{ menu.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar :clipped-left="primaryDrawer.clipped" app>
      <v-app-bar-nav-icon v-if="primaryDrawer.type !== 'permanent'"
                          @click.stop="primaryDrawer.model = !primaryDrawer.model" />

      <v-toolbar
                 extension-height="0"
                 fixed
                 overflow>
        <v-toolbar-title class="tertiary--text font-weight-bold">
          {{ title }}
        </v-toolbar-title>
        <v-spacer></v-spacer>

        <v-progress-linear color="orange" :indeterminate="true" slot="extension" class="pa-0" height="5" value="30" v-show="isLoading"></v-progress-linear>
      </v-toolbar>
    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
    <v-snackbar
                color="#6D85F5"
                v-model="getSnack.isShow"
                :timeout="getSnack.timeout"
                bottom>
      {{ getSnack.msg }}
      <v-btn @click="closeSnack()">
        Close
      </v-btn>
    </v-snackbar>

    <v-footer :inset="footer.inset" app>
      <!-- <span class="px-4">&copy; {{ new Date().getFullYear() }}</span> -->

      <span class="px-4">&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</div>

</template>

<script>

  export default {
    data: () => ({
      drawers: ['Default (no property)', 'Permanent', 'Temporary'],
      title: '전문가 정보 통합 및 분석 시스템',
      primaryDrawer: {
        model: null,
        type: 'permanent',
        clipped: true,
        floating: false,
        // mini: false
      },
      footer: {
        inset: false
      },

      menus: [
        {
          href: 'search',
          title: '검색 및 이력',
          icon: 'search'
        },
        {
          href: 'result',
          title: '결과 확인',
          icon: 'description'
        },
        {
          href: 'ifupdate',
          title: 'IF File Update',
          icon: 'refresh'
        },
        {
          href: 'instcrawler',
          title: 'DBPia 소속 수집기',
          icon: 'apartment'
        }
      ]
    }),

    computed: {
      isLoading() {
        return this.$store.state.isLoading;
      },
      getSnack() {
        return this.$store.state.snack;
      },
      getisMini(){
        return this.$store.state.isMini;
      }

    },
    methods: {
      refreshHistories() {
        this.$store.dispatch('getHistories');
      },
      closeSnack() {
        this.$store.commit('closeSnack');
      }
    }
  }

</script>

<style>


  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }


</style>
