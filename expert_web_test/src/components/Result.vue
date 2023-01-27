<template lang="html">

  <v-container class="mx-auto" >

    <v-layout >
      <v-flex class="flex-md-grow-1 flex-md-shrink-1" >
        <v-card color="#B3D4FB" class="ma-4">

          <component ltext="결과 목록" :is="comp" :lgSize="6" :itemsPerPage="5" :page="$route.params.page" v-on:tabInit="tabInit()" v-on:tabScroll="tabScroll()"></component>
        </v-card>
      </v-flex>


    </v-layout>


    <!-- <vue-tabs type="pills">
    <v-tab v-for="(tab, i) in tabs" :key="i">
    <div slot="title">{{tab}} <span @click.stop="removeTab(index)" class="ti-close tab-close"></span></div>
    {{tab}}
  </v-tab>
</vue-tabs> -->
<v-layout  md="6">
  <v-flex class="flex-md-grow-1 flex-shrink-1 pa-4">

    <v-tabs v-show="getTabs.length != 0 " :value="getActiveTab"
    show-arrows
    slider-color="none"
    class="elevation-2" background-color="#011176" dark

    >
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="(tab) in getTabs"
    :key="tab._id"
    >
    {{ tab.query_keyword }}
    <!-- <v-btn  small text left icon @click.stop="closeTab(tab._id)">
    <v-icon small @click="closeTab(tab._id)">close</v-icon>
  </v-btn> -->
</v-tab>
<div id="keywordtabs">

</div>
<v-tab-item v-for="(tab, ti) in getTabs" :key="tab._id">
  <template >
    <v-flex >
      <v-card class="ma-4">
        <div>
          <p class="text-left font-weight-bold headline pt-4 pl-4">
            결과 상세
          </p>
          <p class="headline text-center">검색 키워드 : {{  tab.query_keyword }}</p>
        </div>
        <v-tabs v-model="getActiveInnerTab[ti]"
        class="elevation-2"
        dark background-color="#011176">
        <v-tabs-slider></v-tabs-slider>
        <v-tab v-for="(site, i) in tab.sites"
        :key="i">
        {{ site.site }}( {{ statusLabel[site.state]}}   : {{ site.progress }}%)

      </v-tab>

      <v-tab-item v-for="(site, si) in tab.sites"
      :key="si">

      <v-card flat tile color="#B3D4FB">

        <v-card-text class="text-left font-weight-bold text-h6">가중치 설정</v-card-text>
        <!-- <v-card-title class="subheading font-weight-bold">{{ item.keyword }}</v-card-title> -->
        <!-- <v-card-subtitle>{{ getStatus(item.status)}} </v-card-subtitle> -->
        <!-- <v-divider></v-divider> -->
        <!-- class="justify-end" -->
        <v-card-actions >



          <v-container >
            <v-layout>
              <v-card color="white" class="flex-grow-1 flex-shrink-0">

<!-- v-show='isShowGongmo(site.site, i)' -->
                <v-row align="center" justify="center" v-for="(weight, i) in weights" :key="i" class="mt-2 mb-2"

                 >
                  <v-col cols="2" class="pt-0 pb-0">
                    <div>
                      <v-subheader class="font-weight-bold text-h7 ml-2 mt-1">
                        {{weightLabel[i]}}
                      </v-subheader>
                    </div>
                  </v-col>
                  <v-col cols="10" class="pt-0 pb-0">
                    <!-- <div> -->
                    <!-- :label="getLabel(i)" -->
                    <!-- color="#011176" -->
                    <v-slider

                    :value="weight"
                    v-show='isShowSlider(site.site, i)'
                    height="5"
                    v-model="weights[i]"
                    thumb-label="always" class="mt-5 pr-4">
                    <!-- <template slot="label" slot-scope="props">

                    asd {{props.value}}

                  </template>
                  <template v-slot:label="item" class="wslider">
                  asd{{item.value}}
                </template> -->
              </v-slider>
              <!-- </div> -->
            </v-col>
            <v-row>
              <v-col cols="12" >
                <hr class="ml-3 mr-3"/>

              </v-col>

            </v-row>
          </v-row>


          <v-row>
            <v-col>
              <v-btn class="mt-2 mb-2 primary" @click="getExperts(tab._id, site.site, si, site.state)">가중치 적용</v-btn>

            </v-col>
          </v-row>

        </v-card>

      </v-layout>
      <v-spacer></v-spacer>
    </v-container>

  </v-card-actions>

</v-card>

<v-card class="mt-5" flat tile color="#B3D4FB" :disabled="cardLoading">

  <v-card-text  id="experttable"  class="text-left font-weight-bold text-h6">전문가 정보  ( {{proOrPap(site.site) }} :
    {{ transformLocale(site.data) }}
    <v-icon class="ml-2"
    @click="clkDownloadPapers(site.site, site.experts)"
    >{{ mdiDownload }}</v-icon>
      /
     Experts :
      {{transformLocale(site.experts)}}
     <v-icon class="ml-2"
     @click="clkDownloadExperts(site.site, site.experts)"
     >{{ mdiDownload }}</v-icon>
     )
  </v-card-text>

    <!-- <v-card-title class="subheading font-weight-bold">{{ item.keyword }}</v-card-title> -->
    <!-- <v-card-subtitle>{{ getStatus(item.status)}} </v-card-subtitle> -->
    <!-- <v-divider></v-divider> -->
    <!-- class="justify-end" -->
    <v-card-actions>

      <v-container>
        <v-layout>
          <v-card class="flex-grow-1 flex-shrink-0 mb-2">
            <v-row align="center" justify="center">

              <v-col >
                <div>
                  <v-data-table
                  :headers="getHeaders(site.site)"
                  :items="site.lists"
                  :server-items-length="getTotal(site.experts)"
                  :loading="loading"
                  class="elevation-1"
                  :options.sync="options"
                  >
                  <template v-slot:item.site="{ item }" >
                       <v-chip  class="identical pa-2" :color="siteColor[item.site]" dark>{{item.site}}</v-chip>
                   </template>

                   <template v-slot:item.Productivity="{ item }" >
                        {{item.Productivity}} ( {{item.Numpaper}} 건 )
                    </template>




                  <template v-slot:item.actions="{ item }">
                    <v-icon
                    @click="clkDownload(item)"
                    >{{ mdiDownload }}</v-icon>
                  </template>
                  <template v-slot:item.actions2="{ item }">
                    <v-icon
                    @click="clkRelation(item)"
                    >{{ mdiGraphql }}</v-icon>
                  </template>

                </v-data-table>
              </div>
            </v-col>




          </v-row>
        </v-card>
      </v-layout>

      <v-card flat tile id="expertrel" >

        <v-card-text class="text-left font-weight-bold text-h6">{{clkNode}} 관계 정보</v-card-text>
        <!-- v-if="getRelationships != undefined"  -->
        <!-- :net-nodes="nodes"
        :net-links="links" -->
        <d3-network ref="net"

        :net-nodes="getRelationships.nodes"
        :net-links="getRelationships.links"

        :options="d3_options" @node-click="nodeClick" />


      </v-card>
      <v-spacer></v-spacer>
    </v-container>

  </v-card-actions>

</v-card>
</v-tab-item>
</v-tabs>
</v-card>

</v-flex>
</template>
</v-tab-item>


</v-tabs>
</v-flex>
</v-layout>
</v-container>

</template>


<script>

import History from './History.vue'
import D3Network from 'vue-d3-network'
import { mdiDownload } from '@mdi/js';
import { mdiGraphql } from '@mdi/js';
import * as easings from 'vuetify/es5/services/goto/easing-patterns'

export default {
  data() {
    return {
      siteColor : {'NTIS' : 'orange', 'DBPIA' : 'red', 'SCIENCEON' : 'blue', 'KCI' :'indigo', 'SCOPUS' : 'lime', 'WOS' : 'purple'},
      statusLabel : { '0' : 'Crawling', '1': 'Analyzing', '2' : 'Completed', '-1' : "Crawling Failed", '-2' : "Consumer Failed" , '-3' : "Analyzer Failed"},
      // weightLabel : [ '품질', '생산성', '기여도'],
      weightLabel : ['최신성', '품질', '생산성', '정확성', '협업도', '기여도','연구지속성'],
      easing: 'easeInOutCubic',
      test : 'tt',
      easings: Object.keys(easings),
      page : -1,
      mdiDownload : mdiDownload,
      mdiGraphql : mdiGraphql,
      selected : [],
      last : 0,
      tab: 'tab-0',
      tabs: 4,
      comp: 'History',
      items: ['전체', 'Korea', 'US', '..'],
      model: ['전체'],
      options: {},

      weights : [], // essential factor
      //    sweights : [], //selective factor
      relationship : {},
      clkNode : "",
      headers: [
        { text: '순위', value: 'rank', sortable: false , align: 'center'},
        {
          text: '이름',
          align: 'start',
          sortable: false,
          value: 'name',
          width : 200,
        },
        { text: '소속', value: 'inst', sortable: false , align: 'center', width : 200},
        {
          text: '수집 사이트', value: 'site', sortable: false , align: 'center'
        },
        { text: '최신성', value: 'Recentness' ,sortable: false, align: 'center'},
        { text: '품질', value: 'Quality',sortable: false, align: 'center' },
        { text: '생산성', value: 'Productivity' ,sortable: false, align: 'center'},
        { text: '정확성', value: 'Acc' , sortable: false,align: 'center'},
        { text: '협업도', value: 'Coop' , sortable: false,align: 'center'},
        { text: '기여도', value: 'Contrib' , sortable: false,align: 'center'},
        { text: '연구지속성', value: 'Durability' , sortable: false,align: 'center'},
        { text: '총점', value: 'EScore' , sortable: false,align: 'center'},
        { text: '관련데이터', value: 'actions', sortable: false , align: 'center'},
        { text: '관계', value: 'actions2', sortable: false , align: 'center'}
      ],
      cardLoading : false,
      loading: false,
      canvas : false,

      isComp : 2,
      force:50,
      fX:0.5,
      fY:0.5,
      fMb:true,
      fC:false,
      lastSite : '',
      // d3_options : {
      //   size : {w : 600 , h : 600},
      //     force: 3000,
      //     nodeSize: 20,
      //     nodeLabels: true,
      //     linkLabels : true,
      //     // linkWidth:1,
      //     canvas : false,
      //     strLinks : true
      //   }




    }
  }, //data() End

  components: {
    History,
    D3Network,

  },
  watch: {
    options: {
      handler() {
        let aId = this.getActiveTab;
        let inIdx = this.getActiveInnerTab[aId];
        // let aIdx = this.getTabs.findIndex(x=> x._id == aId);
        let site = this.getTabs[aId].sites[inIdx].site;
        // if( == isComp)
        if(inIdx != 0)
          this.getExperts(this.getTabs[aId]._id, site, inIdx, this.getTabs[aId].sites[inIdx].state);

      },
      deep: true
    }
  },
  mounted() {
  },

  created() {
    this.weights = new Array(7).fill(50);
    this.$store.commit("setIsMini", false);
    //for gongmo
    // this.weights[0] = 0
    // this.weights[3] = 0
    // this.weights[4] = 0
    // this.weights[6] = 0
     // this.weights = new Array(3).fill(50);
       // this.sweights = new Array(1).fill(50);
  },
  computed: {
    getActiveInnerTab(){
      return this.$store.state.activeInnerTab;
    },
    getActiveTab()
    {
      return this.$store.state.activeTab;

    },
    d3_options(){
      return {force: 3000,
        nodeSize: 20,
        nodeLabels: true,
        linkLabels : false,
        linkWidth:1,
        canvas : this.canvas,
        offset : {
          x : 0,
          y : 0,
        },
        strLinks : true,
        // strLinks : true,
      }
    },
    getRelationships(){


      let aId = this.getActiveTab
      let inIdx = this.getActiveInnerTab[aId];
      // let aIdx = this.getTabs.findIndex(x=> x._id == aId);
      let site = this.getTabs[aId].sites[inIdx].site;

      if(this.relationship[aId] == undefined || this.relationship[aId][site] == undefined)
      return {nodes : [], links : []}

      return this.relationship[aId][site];

    },

    getWeigths(){
      return this.weights;
    },
    getTabs() {
      // this.$store.state.tabs;

      return this.$store.state.tabs;
    },
    isShowDetail(){
      return this.getTab._id === -1;
    },
    // getTabWeights : {
    //   get: function () {
    //     let site = Object.keys(this.getTab.history.sites)[this.tab.split('-')[1]]
    //     let weights = this.getTab[site].weights
    //
    //       return this.getTab[site].weights
    //   },
    //   set: function (value) {
    //     let site = Object.keys(this.getTab.history.sites)[this.tab.split('-')[1]]
    //     this.$store.state.tab[site].weights = value
    //   }
    // }
  },
  methods: {
    transformLocale(v){
      // v.experts
      if (v !== undefined)
        return v.toLocaleString("kr-KR");
        // console.log('V.EXPERTS', v);
      return "";
      // return parseInt(v.experts).toLocalString("kr-KR")
    },
    closeTab(id) {
      this.$store.commit('closeTab', id)
    },

    getExperts(_id, _site, _idx, _state){

      if(_state != this.isComp){
        this.$store.commit('showSnack', "Now "+ this.getStatus(_state));
        return;
      }

      //this.last  = _flag;
      this.loading = true;
      getExpertFromServer(this, _id, _site, _idx).then(() => {
        this.loading = false;
        // this.$vuetify.goTo('#experttable');
        // this.$vuetify.goTo(1600);

      });

      function getExpertFromServer(t, _id, _site, _idx){
        return new Promise((resolve) => {
          let aId = t.getActiveTab;


          if(_idx === 0){
            // t.$store.commit('showSnack', "Not Provided Yet");
            let sites = [...t.getTabs[aId].sites];
             sites.splice(0,1);
            sites = sites.map(x=> x.site);
            // console.log('SITES', sites);

            t.$store.dispatch('getExperts', {_id, _idx, ...t.options, ...t.weights, sites}).then(()=>{

              resolve();
            });
            // resolve();
          }else{

            let total = 0;
            if(t.options.itemsPerPage == -1){
              let inIdx = t.getActiveInnerTab[aId];
              // let aIdx = this.getTabs.findIndex(x=> x._id == aId);
              total = t.getTabs[aId].sites[inIdx].experts;
            }

            t.$store.dispatch('getExperts', {_id, _site, _idx, ...t.options, ...t.weights, total}).then(()=>{
              resolve();
            });

          }

        });
      }

    },
    tabInit(){
      this.tab = 'tab-0';
      // console.log("asd")

    },
    tabScroll(){
      this.$vuetify.goTo(800);
    },
    nodeClick(event, node){
      let aId = this.getActiveTab;
      let inIdx = this.getActiveInnerTab[aId];
      // let aIdx = this.getTabs.findIndex(x=> x._id == aId);
      let view_site = this.getTabs[aId].sites[inIdx].site;

      let site = this.lastSite;


      if(node._color !== 'orange'){
        let A_ID = node.id;
        let keyId = this.getTabs[aId]._id;
        let req = {A_ID, site , keyId, ...this.weights};
        node = Object.assign(node, {_color : "orange"});

        this.$set(this.relationship[aId][view_site].nodes, node.index, node);
        // var start = new Date().getTime();
        this.$store.dispatch('getExpertRelation', req).then(response =>{
          // var elapsed = new Date().getTime() - start;
          let links = [];
          let { asResults : nodes } = response.data;

          nodes.forEach(x=> x._size = x.Escore * 0.2);
          // this.relationship[aId][site];
          let tempR = this.relationship[aId][view_site];
          nodes = nodes.filter(x => tempR.nodes.findIndex(y => y.id === x.id) == -1);

          response.data.results.forEach((ritem) => {
            let width = ritem.count *2;

            let color  = "";
            if(width > 20)
              width = 20;
            if (width > 5 && width <= 10)
            color = "orange";
            else if(width > 11)
            color = "red";
            links.push({
              "sid": ritem.sourceAId,
              "tid": ritem.targetAId,
              "_color" : color,
              // "label" : "test"
              // "name": ritem.count,
              _svgAttrs: {
                "stroke-width": width
              }
            })
          });

          tempR.nodes = tempR.nodes.concat(nodes);

          tempR.links = tempR.links.concat(links);

        });
        // if(node.id == 1){
        // this.relationship[site].nodes.push({id: 10, name :"Test"});
        // this.relationship[site].nodes.push({id: 1, name :"Test"});
        // this.relationship[site].links.push({sid : 10, tid : 1, name : "Test" });
        // }
      }

    },
    // linkClick(event, link){
    //   // link = Object.assign(link, {_color : "orange", name:""})
    //   // this.$set(this.links, link.index, link)
    // },
    clkDownload(item){
      // item.query_keyword = this.getTab.query_keyword;

      let aId = this.getActiveTab;
      let inIdx = this.getActiveInnerTab[aId];
      // let aIdx = this.getTabs.findIndex(x=> x._id == aId);

      if(inIdx != 0){
        let site = this.getTabs[aId].sites[inIdx].site;
        item.site = site;
      }
      // item.site = site;
      // item._idx = parseInt(this.tab.split('-')[1]);
      item.keyId = this.getTabs[aId]._id;
      this.$store.dispatch('getExpertPapers', item);

    },
    clkDownloadPapers(_site){
      // console.log('_SITE', _site);

      let aId = this.getActiveTab;
      let _idx = this.getActiveInnerTab[aId];
      // console.log('_IDX', _idx);


      if(_idx == 0 ){
        this.$store.commit('showSnack', "Not Provided Yet");
      }else{
        this.cardLoading = true;
        this.getTabs[aId]
        let _id = this.getTabs[aId]._id;
        // this.$store.dispatch('downloadExperts', {_id, _site, _idx, ...this.options, ...this.weights, total}).then(()=>t.cardLoading = false);
        // t.$store.dispatch('getExperts', {_id, _site, _idx, ...t.options, ...t.weights, total}).
        // let sites = [...t.getTabs[aId].sites];
        // sites.splice(0,1);
        // sites = sites.map(x=> x.site);
        // console.log('SITES', sites);

        let t = this;
        // let dFlag = true;
        let total=50;
        t.$store.dispatch('getExpertPapers', { keyId : _id, site : _site, _idx, ...t.options, ...t.weights, total, flag : 1}).then(()=> t.cardLoading = false);
        // t.$store.dispatch('getExperts', {_id, _site, _idx, ...t.options, ...t.weights, total, dFlag}).then(
        //   (resp)=> {
        //     console.log('RESP', resp);
        //     // console.log('RESP', resp);
        //     let data = resp.map((x) => {return {A_ID : x.A_ID, inst :  x.inst, name : x.name, rank : x.rank} } )
        //     console.log('DATA', data);
        //     // console.log('DATA', data);
        //
        //
        //   });

        // t.$store.dispatch('getExperts', {_id, _idx, ...t.options, ...t.weights, sites}).then(()=>{
      }

    },
    clkDownloadExperts(_site, total){
      let aId = this.getActiveTab;
      let _idx = this.getActiveInnerTab[aId];
      if(_idx == 0 ){
        this.$store.commit('showSnack', "Not Provided Yet");
      }else{
        this.cardLoading = true;
        let t = this;
        let _id = this.getTabs[aId]._id;
        this.$store.dispatch('downloadExperts', {_id, _site, _idx, ...this.options, ...this.weights, total}).then(()=>t.cardLoading = false);
        // t.$store.dispatch('getExperts', {_id, _site, _idx, ...t.options, ...t.weights, total}).
      }

    },
    lcb(link){
      link.name = 'Link ' + link.name;
      return link;
    },
    clkRelation(item){
      this.clkNode = item.name;


      let aId = this.getActiveTab;
      let inIdx = this.getActiveInnerTab[aId];
      // let aIdx = this.getTabs.findIndex(x=> x._id == aId);

      if(inIdx != 0){
        let site = this.getTabs[aId].sites[inIdx].site;
        item.site = site;
      }
      this.lastSite = item.site;
        // item
      // item._idx = parseInt(this.tab.split('-')[1]);
      item.keyId = this.getTabs[aId]._id;
      item.flag = 1;
      let tempThis = this;
      if(tempThis.relationship[aId] == undefined){
        // tempThis.relationship[aId] = {};
        tempThis.$set(tempThis.relationship, aId, {});
      }

      // item.flag = 1; //table click
      // var start = new Date().getTime();
      // let t = this;
      this.$store.dispatch('getExpertRelation', {...item, ...this.weights})
      .then(response => {
        // console.log('RESPONSE', response);
        // var elapsed = new Date().getTime() - start;
        // t.$vuetify.goTo(9999);
        let links = [];
        const { asResults : nodes } = response.data;
        nodes.forEach(x=> x._size = x.Escore * 0.2);
        response.data.results.forEach((ritem) => {
          let width = ritem.count *2;
          if(width > 20)
            width = 20;
          let color  = "";
          if (width > 5 && width <= 10)
          color = "orange";
          else if(width > 11)
          color = "red";
          links.push({
            "sid": ritem.sourceAId,
            "tid": ritem.targetAId,
            "_color" : color,
            // "name": "test",
            _svgAttrs: {
              "stroke-width": width,

            }
          })


        });
        let s = item.site;
        // let temp = it
        if(inIdx == 0)
          s = 'ALL';
        tempThis.$set(tempThis.relationship[aId], s, {
          nodes, links
        });
        // console.log('TEMPTHIS.RELATIONSHIP[AID]', tempThis.relationship[aId]);

        // tempThis.$set(tempThis.relationship[item.site], 'links', links)


      });

    },
    getLabel(idx) {
      switch (idx) {
        case 0:
        return '최신성';
        case 1:
        return '품질';
        case 2:
        return '생산성';
        case 3:
        return '정확성';
        case 4:
        return '협업도';
        case 5:
        return '기여도';
        case 6 :
        return '연구지속성';
      }
    },
    getSize(score){
      if(score < 50)
      return 10;
      else if(score < 100)
      return 30;
      else if(score < 150)
      return 50;
      else if(score < 200)
      return 70;
      else
      return 100;

    },
    getSLabel(idx) {
      switch (idx) {
        case 0:
        return '연구지속성';
      }
    },
    getStatus(status) {
      switch (status) {
        case 0:
        return 'Crawling'
        case 1:
        return 'Analyzing'
        case 2:
        return 'Completed'
        // case 3:
        //   return 'Stopped'
        // case 4:
        //   return 'Completed'
      }
    },
    proOrPap(site){
      if(site == 'NTIS')
      return "Projects";
      else
      return "Papers";
    },
    isShowGongmo(site, idx){
      if(idx == 0 || idx == 3 || idx == 4 || idx == 6)
        return  false;
      // if(site == 'NTIS' && idx == 4)
      //   return false;
      else
        return true;
    },
    isShowSlider(site, idx){

      if(site == 'NTIS' && idx == 4)
      return false;
      else
      return true;
    },
    getTotal(numExperts){
      if (numExperts >50)
        return 50;
      else
        return numExperts;
    },
    getHeaders(site){

      let tempHeader = [...this.headers];
      if(site == 'ALL'){
        return this.headers;
      }
      else{
        tempHeader.splice(3,1);
        if(site == 'NTIS'){
          tempHeader.splice(7,1);
        }
        return tempHeader;
        // else{
        //   return te;
        // }
      }
    }
  }
}

</script>
<style src="vue-d3-network/dist/vue-d3-network.css"></style>
<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css?family=PT+Sans');

body{
  font-family: 'PT Sans', sans-serif;
  background-color: #eee;
}
.title{
  position:absolute;
  text-align: center;
  left: 2em;
}
h1,a{
  color: #1aad8d;
  text-decoration: none;
}

ul.menu {
  list-style: none;
  position: absolute;
  z-index: 100;
  min-width: 20em;
  text-align: left;
}
ul.menu li{
  margin-top: 1em;
  position: relative;
}

#m-end path, #m-start{
  fill: rgba(18, 120, 98, 0.8);
}
.node-label{
  font-size: .5em;
}
.link-label{
  fill: purple;
  transform: translate(0,.5em);
  font-size: .8em;
}
.node-hover{
  stroke : #ffffff !important;
}

>>>.v-slider__thumb {
  height: 20px;
  width: 20px;
}

>>>.v-slider--horizontal .v-slider__track-container {
  height: 5px;
}
</style>
