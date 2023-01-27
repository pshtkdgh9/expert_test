<template>

  <v-container >


    <template class="md-12">
      <v-layout>
    <!-- <v-row >
      <v-col cols="1" > -->
      <v-flex md1>
        <p class="text-left font-weight-bold text-h5" >
          {{ltext}}
        </p>
        </v-flex>

      <!-- </v-col> -->
    <!-- </v-row> -->
      <!-- <v-col  cols="11" class="" justify-end> -->
      <v-flex md11 justify-end  row wrap class="mt-1 mb-1">
      <!-- <v-btn icon color="grey " class="mr-2" @click="refreshHistories()">
        <v-icon>refresh</v-icon>
      </v-btn> -->
      <v-btn color="grey lighten-2" class="mr-3 mb-2" @click="exapndAll()">
        {{expandString}}
      </v-btn>
        </v-flex>
      <!-- </v-col> -->

    <!-- </v-row> -->
    </v-layout>
  </template>

    <!-- :options.sync="options" -->
    <v-data-table
        :headers="headers"
        :items="getHistories"
        :itemsPerPage="ipg"
        :expanded.sync="expanded"
        :page="page"
        item-key="_id"
        show-expand
        class="elevation-1"
      >
    <template v-slot:item.year="{ item }">
        {{ new Date(item.query_time).getFullYear()-item.year }} ~ {{ new Date(item.query_time).getFullYear() }}
     </template>
  <template v-slot:item.state="{ item }" >
       <v-chip  class="identical pa-2" :color="statusColor[item.state]" v-html="statusLabel[item.state]" dark></v-chip>
   </template>

  <template v-slot:expanded-item="{ headers, item}">

    <td :colspan="headers.length" >
    <!-- {{item._id}} -->
    <v-data-table
        :headers="headers2"
        :items="item.sites"
        hide-default-footer
        class="elevation-1 ma-2"
      >
      <template v-slot:item.site="{ item }">
           {{item.site}}{{getFilterString(item.site, item.filter)}}
       </template>
      <template v-slot:item.data="{ item }">
           {{item.data}}{{getPartialString(item.isPartial)}}
       </template>

      <template v-slot:item.state="{ item }">
           <v-chip class="identical pa-2" :color="statusColor[item.state]" v-html="statusLabel[item.state]" dark></v-chip>
       </template>

       <template v-slot:item.removeaction="{ item }">
         <v-icon
          @click="editHistory(item)" v-show="item.site != 'ALL'"
         >{{  mdiDatabaseEdit    }}</v-icon>
          <v-icon color="red"
           @click="removeHistory(item._id, item.site)"
          >{{  mdiDelete    }}</v-icon>

        </template>
        <template v-slot:item.data="{ item }">
          {{transformLocale(item.data)}}
        </template>
        <template v-slot:item.experts="{ item }">
          {{transformLocale(item.experts)}}
        </template>

    </v-data-table>
    </td>
  </template>


  <template v-slot:item.actions="{ item }">
     <v-icon v-show="isShow(item.sites)"
      @click="getDetailHistory(item._id, getHistories.indexOf(item), item.sites[0].progress)"
     >{{  mdiChevronRightCircle  }}</v-icon>
   </template>

   <template
   v-slot:item.integration="{ item }">
      <v-icon
      v-if="(new Date(item.query_time).getFullYear()-2022)*12 + new Date(item.query_time).getMonth()-4<0"
       v-show="isShow(item.sites)"
       @click="goIntegrationPage(item._id, item.query_keyword, item)"
      ></v-icon>
      <v-icon
      v-else
       v-show="isShow(item.sites)"
       @click="goIntegrationPage(item._id, item.query_keyword, item)"
      >{{  mdiChevronRightCircle  }}</v-icon>
    </template>
    <template v-slot:item.stop="{ item }">
       <v-icon
       v-if="item.state != 2"
       @click="stopPage(item._id, item.query_keyword, item)"
       >{{  mdiClose  }}</v-icon>
     </template>


   <template v-slot:item.removeaction="{ item }">
      <v-icon v-show="isShow(item.sites)" color="red"
       @click="removeHistory(item._id, 'ALL')"
      >{{  mdiDelete    }}</v-icon>
    </template>

</v-data-table>

    <v-dialog
         v-model="dialog"
         max-width="500px"
       >
         <v-card>
           <v-card-title>
             <span class="text-h5">Site : {{editedItem.site}} (keyID : {{editedItem._id}}) </span>
           </v-card-title>

           <v-card-text>
             <v-container>
               <v-row>
                 <v-col
                   cols="12"
                   sm="6"
                   md="4"
                 >
                   <v-text-field
                     v-model="editedItem.state"
                     label="State"
                   ></v-text-field>
                 </v-col>
                 <v-col
                   cols="12"
                   sm="6"
                   md="4"
                 >
                   <v-text-field
                     v-model="editedItem.progress"
                     label="Progress"
                   ></v-text-field>
                 </v-col>

               </v-row>
             </v-container>
           </v-card-text>

           <v-card-actions>
             <v-spacer></v-spacer>
             <v-btn
               color="blue darken-1"
               text
               @click="close"
             >
               Cancel
             </v-btn>
             <v-btn
               color="blue darken-1"
               text
               @click="save"
             >
               Save
             </v-btn>
           </v-card-actions>
         </v-card>
       </v-dialog>


  </v-container>

</template>
<script>
import {  mdiChevronRightCircle , mdiDelete , mdiDatabaseEdit, mdiClose  } from '@mdi/js';
import Vue from 'vue'
  export default {
    data() {
      return {
        statusLabel : { '0' : 'Crawling', '1': 'Analyzing', '2' : 'Completed', '-1' : "Crawling Failed", '-2' : "Consumer Failed" , '-3' : "API Limit"},
        statusColor : { '0' : 'red', '1' : 'orange', '2' : 'green', '-1' : 'blue', '-2' : '#7676a7', '-3' : 'black'},
        expandString : 'Expand All',
        isExpandAll : false,
        dialog : false,
        mdiChevronRightCircle  :  mdiChevronRightCircle ,
        mdiClose : mdiClose,
        mdiDelete   : mdiDelete ,
        mdiDatabaseEdit : mdiDatabaseEdit ,
        expanded: [],
        options : {},
        editedItem: {
          _id : -1,
          site: '',
          state: 0,
          progress: 0,
        },
        // page: 1,
        headers: [
          {
            text: 'KeyID',
            align: 'start',
            sortable: false,
            value: '_id',
          },
         {
           text: '검색어',
           align: 'start',
           sortable: false,
           value: 'query_keyword',
         },
         { text: '검색 시간', value: 'query_time' },
         { text: '진행 상태', value: 'state' },
         { text: '논문 검색 연도', value: 'year', sortable: false , align: 'center' },
         { text: '상세 보기', value: 'actions',sortable: false , align: 'center' },
          { text: '통합 결과', value: 'integration',sortable: false , align: 'center' },
          { text: '수집 종료', value: 'stop',sortable: false , align: 'center' },

       ],
       headers2: [
         {
           text: '사이트명',
           align: 'start',
           sortable: false,
           value: 'site',
         },
         {
           text: '진행률',
           align: 'start',
           sortable: false,
           value: 'progress',
         },
         {
           text: '진행 상태',
           align: 'start',
           sortable: false,
           value: 'state',
         },
        {
          text: '수집 시간',
          align: 'start',
          sortable: false,
          value: 'crawl_time',
        },
        {
          text: '수집량',
          align: 'start',
          sortable: false,
          value: 'data',
        },  {
            text: '분석 시간',
            align: 'start',
            sortable: false,
            value: 'a_time',
          },  {
              text: '분석량',
              align: 'start',
              sortable: false,
              value: 'experts',
            },

      ],
        itemsPerPageArray: [4, 8, 12]
        // filterStr : { : '(ALL)' ,  false : '(Korea)'}
        // page: 1,


      }
    },

    beforeDestroy() {
      window.removeEventListener('keyup', this.handler);
    },
    watch: {
      options: {
        handler(){

          //console.log('THIS.PAGE', this.page);
          //console.log('THIS.OPTIONS.PAGE', this.options.page);
          this.page = this.options.page;
        },
        deep: true
      }
    },
    props : ['lgSize', 'itemsPerPage', 'page', 'ltext'],
    created(){
      this.$store.dispatch('getHistories');
      const component = this;
      const tempHeader = component.headers;
      const tempHeader2 = component.headers2;

      // this.initialize()
      this.handler = function (e) {
        component.$emit('keyup', e);

        if (e.which === 115) {
          component.ok = !component.ok;
          if (component.ok){
            // component.headers = component.headers.slice(0, 4)
            tempHeader.push({ text: 'Actions', value: 'removeaction', sortable: false });
            tempHeader2.push({ text: 'Actions', value: 'removeaction', sortable: false });
            // tempHeader2.push({ text: '수정', value: 'editaction', sortable: false });

          }else {
            // component.headers.push({ text: 'Actions', value: 'actions', sortable: false })
            tempHeader.splice(8, 1);
            tempHeader2.splice(7, 1);

          }
        }
      }
      window.addEventListener('keyup', this.handler);

    },
    computed: {
      getHistories() {
        return this.$store.state.histories;
      },
      numberOfPages() {
        return Math.ceil(this.getHistories.length / this.itemsPerPage);
      },
      ipg(){
        return this.itemsPerPage;
      }
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
      goIntegrationPage(id, query_keyword, item){
        console.log('ITEM', item);

        // this.$store.dispatch('getIntegrationData', {'id' : id, 'query_keyword' : query_keyword, 'sites' : item.sites});
        this.$store.dispatch('getIntegrationData', {'id' : id, 'query_keyword' : query_keyword});
        // let routerData = this.$router.resolve({path:"/integration", query : {"id":id,'query_keyword' : query_keyword}});
        // window.open(routerData.href);
        this.$router.push({name: 'integration'});

      },
      stopPage(id, query_keyword, item){
      console.log('ITEM', item);

      // this.$store.dispatch('getIntegrationData', {'id' : id, 'query_keyword' : query_keyword, 'sites' : item.sites});
      this.$store.dispatch('getstopPage', {'id' : id, 'query_keyword' : query_keyword});
    },
      close(){
        this.dialog = false;
      },
      save(){
        this.dialog = false;

        this.$store.dispatch('editHistory', this.editedItem).then(() =>{
          // console.log(res);
          this.refreshHistories();
          // console.log("y");
        });
        // console.log('ITEM', this.editedItem);
      },

      editHistory(item){
        // console.log('ITEM', item);
        this.editedItem = Object.assign({}, item);
        this.dialog = true;

      },
      removeHistory(_id, _site){
        // console.log(_id, _site);
        // console.log();
        if (confirm("Are you sure?") == true){
          if (this.getHistories[this.getHistories.findIndex(x=> x._id == _id)].sites.length == 2){
            _site = 'ALL';
          }
          // console.log(_id, _site);
          this.$store.dispatch('removeHistory',{'keyId': _id, 'site' : _site}).then(() =>{
            // console.log(res);
            this.refreshHistories();
            // console.log("y");
          });


        }

      },
      getFilterString(site, flag){
        if(site == 'WOS' || site == 'SCOPUS')
          if(flag)
            return "(ALL)";
          else
            return "(Korea)";

        return "";
      },
      getPartialString (flag){
        if(flag !== 'undefined' && flag)
        {
          return "(Partial Crawled)";
        }
      },
      getDetailHistory(id, _idx, all_pro){
        // console.log('IT', it);
        // console.log(this.options);
        // this.options.page = 5;
        let idx = this.$store.state.tabs.findIndex(x=> x._id === id);
        // console.log('THIS.$STORE.STATE.TABS', this.$store.state.tabs);

        if(idx == -1){
          this.$emit('tabInit');
          this.$store.dispatch('getDetailHistory', {'id' : id});
          //reuse code
          if(this.lgSize != 6){
            // console.log('_IDX', Math.ceil(_idx/5));
            this.$router.push({name: 'result', params : {page:Math.ceil(_idx / 5)}});
          }
        }
        else{
          if(this.$store.state.tabs[idx].sites[0].progress != all_pro){

            Vue.delete(this.$store.state.tabs, idx);
            this.$emit('tabInit');
            this.$store.dispatch('getDetailHistory', {'id' : id});
          }
          else{
            this.$store.state.activeTab = idx;
          }

          if(this.lgSize != 6){
            // console.log('_IDX', Math.ceil(_idx/5));
            this.$router.push({name: 'result', params :  {page:Math.ceil(_idx / 5)}});
          }
        }
        this.$emit('tabScroll');
      },
      refreshHistories() {
        this.$store.dispatch('getHistories', 0)
      },
      //remove code
      getStatusColor(state) {

        switch (state) {
          case 0:
            return 'red'
          case 1:
            return 'orange'
          case 2:
            return 'green'
          }
      },
       //remove code
      getColor(pcnt) {
        if (pcnt >= 100) return 'green'
        else if (pcnt > 50) return 'orange'

        return 'red'
      },
      //remove code
      getStatus(status) {
        switch (status) {
          case 0:
            return 'Crawling '
          case 1:
            return 'Analyzing '
          case 2:
            return 'Completed'
          // case 3:
          //   return 'Stopped'
          // case 4:
          //   return 'Completed'
        }
      },
      isShow(sites){
        if( sites.findIndex(x=>x.state==2) == -1)
          return false;
        else
          return true;

      },
      exapndAll(){
        let tempString = "";
        if(this.isExpandAll){
          this.expanded = [];
          tempString = "Expand All";
        }
        else{
          this.expanded =this.$store.state.histories;
          tempString = "Collapse All";
        }

        this.expandString = tempString;
        this.isExpandAll = !this.isExpandAll;
        // this.exapanded.push(this.$store.state.histories[0])
        // this.$set(this.exapaned, this.$store.state.histories)
        // this.exapaned = this.$store.state.histories)
      }
    }
  }

</script>
<style>
.identical {
  width : 100px;
  justify-content : center !important;

}


</style>
