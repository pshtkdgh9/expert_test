<template lang="html">
<!-- <div>

  asd
</div> -->
  <v-container fluid align-start>

<v-row align="center" justify="center">

  <v-col cols="20" md="12">
    <v-card>
      <v-card-text>
        <v-row align="center" justify="center">
          <v-col cols="12" md="6" class="pl-8">
            <v-form v-model="valid">

            <v-text-field class="mx-4" flat hide-details
            label="Search"
            prepend-inner-icon="search"
            v-model="keywords"
            @keydown.enter="onSearch"
            :rules="searchWordRules"
            solo-inverted></v-text-field>
            </v-form>
          </v-col>
          <v-col cols="4" md="5" class="mr-8">

            <v-btn class="mx-4" color="success" :disabled="!valid"  @click="onSearch()">검색</v-btn>

            <v-btn class="mx-4" color="primary" @click="openDetailSearch()">상세 검색</v-btn>

            <v-dialog v-model="searchDialog" persistent max-width="800px">
              <v-card>
                <v-card-title>
                  <span class="headline">검색 상세 설정</span>
                </v-card-title>
                <v-list three-line subheader>
                  <v-subheader>Select Sites</v-subheader>
                  <v-list-item>
                    <v-list-item-action>
                      <v-checkbox type="checkbox" v-model.lazy="selectAll" label="모든 사이트"></v-checkbox>

                    </v-list-item-action>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item>
                  <v-chip v-for="(site, idx) in sites" :key="idx"
                  class="pa-1"
                  color="white"
                  text-color="black"
                  x-large
                  >
                    <!-- <v-checkbox v-model="selected" :label="site.site" :value="site" :disabled="!site.canCrawl"></v-checkbox> -->
                    <v-checkbox v-model="selected" :label="site.site" :value="site" ></v-checkbox>
                    <v-speed-dial
                    v-show="(site.site === 'WOS' && site.canCrawl ) || (site.site === 'SCOPUS' && site.canCrawl )"
                    v-model="site.fab"

                   direction="bottom"
                   :open-on-hover="true"
                   transition="slide-x-transition"
                  >
                  <template v-slot:activator>
                   <v-btn
                     color="blue darken-2"
                     dark
                     fab
                     x-small
                     class="pa-5"
                     @click="hidden  = !hidden,site.filter = !site.filter"
                     >
                     {{hidden ? filterMsg[site.filter] : filterMsg[site.filter] }}
                   </v-btn>
                  </template>
                  <!-- <v-btn
                   fab
                   dark
                   x-small
                   color="green"
                   class="pa-5"
                   @click="site.filter=true"
                  >
                  ALL
                  </v-btn>
                  <v-btn
                   fab
                   dark
                   x-small
                   color="indigo"
                   class="pa-5"
                   @click="site.filter=false"
                  >
                   Korea
                  </v-btn> -->
                  </v-speed-dial>
                  </v-chip>
                </v-list-item>
                </v-list>
                <v-form v-model="valid">
                  <v-card-text>

                    <v-container>

                      <template v-bind:props="searches">
                        <v-text-field :label="new Date().getFullYear()-years+ylabel" required v-model="years" :rules="numRules" min="1" max="30" type="number"></v-text-field>
                        <v-row v-for="(w, i) in searches" :key="i">
                          <v-col cols="10" sm="10" md="8">
                            <v-text-field label="검색어" required v-model="w.word" :rules="wordRules"></v-text-field>
                          </v-col>
                          <v-col cols="2" sm="2" md="2">
                            <v-select label="연산" :items="operations" v-model="w.type"></v-select>
                          </v-col>
                          <v-col cols="2" sm="2" md="2">
                            <v-btn  @click="removeKeyword(i)">삭제
                            </v-btn>
                          </v-col>
                        </v-row>
                      </template>
                      <v-row>
                        <v-col cols="12">
                          <v-btn class="mx-2" fab color="white" @click="addSearchItem()">
                            <v-icon dark>add</v-icon>
                          </v-btn>
                        </v-col>
                      </v-row>

                    </v-container>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="setKeywords()" :disabled="!valid">Save</v-btn>
                  </v-card-actions>
                </v-form>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>

        <v-row align="center" justify="center">

          <v-col cols="20" md="11">
            <v-spacer />
            <v-card color="#B3D4FB">
              <component :is="comp" :lgSize="3" :itemsPerPage="10" ></component>
            </v-card>
          </v-col>

        </v-row>

      </v-card-text>
    </v-card>
  </v-col>
</v-row>

<v-dialog
v-model="dupDialog"
max-width="290"
>
<v-card>
  <v-card-title class="headline">중복 이력 확인</v-card-title>

  <v-card-text v-html="dupMsg">

  </v-card-text>

  <v-card-actions>
    <v-spacer></v-spacer>

    <v-btn
    color="green darken-1"
    text
    @click="dupDialogClick(true)"
    >
    Yes
  </v-btn>

  <v-btn
  color="green darken-1"
  text
  @click="dupDialogClick(false)"
  >
  No
</v-btn>
</v-card-actions>
</v-card>
</v-dialog>

</v-container>

</template>


<script>

import History from './History.vue'
// import { mdiAlphaACircle } from '@mdi/js';
// import { mdiAlphaKCircle } from '@mdi/js';
// import XLSX from 'xlsx'

export default {
  components: {
    History
  },
  data() {
    return {
      // crawlBtnText : '수집 요청',
      // isCrawl : false,
      // crawlStatus : '알 수 없음',
      // estimatedTime : '',
      // crawlProgress : 0,
      // numComp : 0,
      // total : 0,
      // fileDialog : false,
      // instCrawlerDialog : false,
      // menus : [
      //   "IF File update", "DBPia 소속 수집기"],
      //   file : { sci : null, kci : null},
        ylabel : " 년 이후 논문 수집",
        years : 5,
        valid : true,
        comp: 'History',
        searchDialog: false,
        siteDialog: false,
        tempSelected : [],
        selected : [],
        sites: [
          {'site' : 'NTIS', 'canCrawl' : true, 'filter' : true},
          {'site' : 'SCIENCEON', 'canCrawl' : true , 'filter' : true},
          {'site' : 'DBPIA', 'canCrawl' : true , 'filter' :  true},
          {'site' : 'KCI', 'canCrawl' : true, 'filter' :  true },
          {'site' : 'SCOPUS', 'canCrawl' : true, 'filter' : true, 'fab' : false},
          {'site' : 'WOS', 'canCrawl' : true, 'filter' : true, 'fab' : false}

        ],
        operations: ['AND', 'OR', 'NOT'],
        keywords : "",
        searches: [

        ],
        numRules : [
          v => !!v || 'Search year is required',
          v => v > 0 || 'Positive number only'
        ],

        searchWordRules : [
            v => this.checkSpecificKey(v) || 'Special characters are not available'
        ],
        wordRules : [
          v => !!v || 'Search keyword is required',
          v => this.checkDuplication(v) || 'Same keyword is not available',
          v => this.checkSpecificKey(v) || 'Special characters are not available'
        ],
        dupMsg : "",
        dupDialog : false,
        timer : null,
        // filters : {'WOS' : {"filter" : "ALL"}, 'SCOPUS' : {"filter" : "ALL"}},
        // CFilters : [
        //   {
        //     icon : mdiAlphaACircle,
        //     name : 'ALL'
        //   },
        //   {
        //     icon : mdiAlphaKCircle,
        //     name : 'KOREA'
        //   }
        // ],

        filterModel : 1,
        filterMsg : { true : "ALL" , false : 'Korea'}


      }
    }, //data() End
    computed: {
      selectAll: {
        get: function () {
          return this.sites ? this.selected.length === this.sites.filter(site=>site.canCrawl).length : false
        },
        set: function (value) {
          // console.log('VALUE', value);
          let selected = [];
          if (value) {
            selected = this.sites.filter(site=>site.canCrawl);
          }
          this.selected = selected;
        }
      }
    },

    created() {
      this.selected = this.sites.filter(site=>site.canCrawl);

      // console.log("created");
      this.startInterval();
      this.$store.commit("setIsMini", false);


    },
    destroyed(){
      // console.log("dest");
      clearInterval(this.timer);
    },
    methods: {
      onFilterClick(site){
        console.log('SITE', site);
        this.sheet = false;

      },
      checkSpecificKey(str) {
        var specialKey = "[~#@%$^&*={}:;,\\[\\].<>/?~#￥……&*??{}【】；：”“。，、？]";
        for (var i = 0; i < str.length; i++) {
          if (specialKey.indexOf(str.substr(i, 1)) != -1) {
            return false;
          }
        }
        return true;
      },
      startInterval(){

        // const getHistory = (t) =>{
        //   t.$store.dispatch('getHistories');
        //   console.log("get History");
        // }

        this.timer = setInterval(() => {

              this.$store.dispatch('getHistories',0);
              console.log("get History");
            }, 10000);
      },
      translteKeywords(){

        // var keywords = this.keywords
        // var stack = []
        // let word = ""
        // let type = ""
        // var words = keywords.split("");
        // for (var i = 0; i < words.length; i++) {
        //   if (words[i].charAt(0) === "|" && words[i].includes("(")){
        //     type ="OR";
        //     temp+=words[i]
        //   }
        //   else if(word.charAt(0) === "!"&& word[i].includes("(")){
        //     type ="NOT";
        //     temp+=words[i]
        //   }
        //
        //     if(words[i].charAt(0) === "|" && !word[i].includes("(")){
        //     type = "OR";
        //     words[i] = words[i].replace(/\|/g, "");
        //     temp+=words[i]
        //     }
        //     else if(word.charAt(0) === "!"&& !word[i].includes("(")){
        //
        //       type = "NOT";
        //       words[i] = words[i].replace(/!/g, "");
        //       temp+=words[i]
        //     }
        //     else{
        //     temp+=words[i]
        //
        //   }
        //     this.searches.push({words[i], type})
        //     word = "";
        //     type = "";
        //     stack.append("(");
        //     word+=i;
        //   }
        //   else if(keywords[i] == ")"){
        //     stack.pop();
        //     word+=i;
        //     this.searches.push({word, type})
        //     word = "";
        //   }
        //   else{
        //     word +=i;
        //   }
        // }
        this.searches = []
        this.keywords.trim().split(' ').forEach(word => {

          if(word.length != 0){
            let type = ""
            // if(word.charAt(0) === "\"" && word.charAt(word.length-1) === "\"")
            if(word.charAt(0) === "|"){
            type = "OR";
            word = word.replace(/\|/g, "");
            word = this.insertbracket(word);
            console.log("or word",word);
            }
            else if(word.charAt(0) === "!"){

              type = "NOT";
              word = word.replace(/!/g, "");
              word = this.insertbracket(word);
              console.log("not word",word);

            }
            else
            type = "AND";
            word = this.insertbracket(word);
            console.log("and word",word);


            this.searches.push({word, type})
            //this.searches.push({word: word.replace(/!/g, ""), type : type})
          }
        })
        // for (var i = 0; i < this.searches.length; i++){
        //   if (this.searches[i].word.includes("(")){
        //     temp.push(i)
        //   }
        //   else if (temp.length != 0){
        //     temp.push(i)
        //   }
        //   else if (this.searches[i].word.includes(")")){
        //     var temp_string = '';
        //     for (var j = 0; temp.length; j++){
        //       temp_string += this.searches[temp[j]].word
        //     }
        //     this.searches[temp[0]] = {temp_string, this.searches[temp[0].type]}
        //   }
        // }

      },
      search(){
        this.translteKeywords();
        this.setKeywords();
        this.$store.dispatch('requestSearch', {searches: this.searches, sites : this.selected, years : this.years})
      },
      onSearch(){
        if(this.keywords.trim().length > 0) {
          if (!this.checkSpecificKey(this.keywords.trim()))
          {
            this.$store.commit('showSnack', "특수 문자를 입력할 수 없습니다.");
            return;
          }
          if (!this.checksites()){
            if(this.checkKor(this.keywords.trim())){
              // this.$store.commit('showSnack', "해외 사이트는 한글 검색이 지원 되지 않습니다.");
              this.removeEnsites();
                if(this.checkDuplicationHistories())
                  return;


                this.search();
            }else{
              if(this.checkDuplicationHistories())
                return;


              this.search();
            }
         }else{
             if(this.checkDuplicationHistories())
               return;


             this.search();
          }
        }else{
          this.$store.commit('showSnack', "키워드를 입력해주세요")
        }


      },
      removeKeyword(idx){
        this.searches.splice(idx, 1)
      },
      insertbracket(word){
        word = word.replace(/\(/g,`'('`);
        word = word.replace(/\)/g,`')'`);
        word = word.replace(/''/g,`'`);
        console.log("word",word)
        return word
      },
      setKeywords() {
        let rtv = ''
        let size = this.searches.length - 1
        this.searches.forEach((w, idx) => {
          // let type = ""
          switch (this.operations.indexOf(w.type)) {
            case 0:
            rtv += w.word
            break
            case 1:
            rtv += '|'+w.word
            break
            case 2:
            rtv += '!' + w.word
            break
            // case 3:
            // rtv += '(' + w.word
            // break
            // case 4:
            // rtv += w.word + ")"
            // break
          }
          if (size != idx) rtv += ' '
        })
        // rtv = rtv.replace(/\(/g,`'('`)
        // rtv = rtv.replace(/\)/g,`')'`)
        console.log("rtv",rtv)
        this.keywords = rtv
        this.searchDialog = false
      },
      openDetailSearch()
      {
        if(this.keywords.trim().length > 0){
          this.translteKeywords()
        }
        this.searchDialog = true
      },
      dupDialogClick(isSearch){
        this.dupDialog = false;
        if(isSearch)
        this.search();
      },
      checkDuplicationHistories(){
        let numWords = 0;
        let tempCheck = {};
        this.keywords.trim().split(' ').forEach(word => {
          console.log('WORD', word);
          numWords++;
          let histories = this.$store.state.histories;


          histories = histories.filter(x => x.query_keyword.split(' ').filter(hWord=> hWord === word).length > 0)
          console.log('HISTORIES', histories);
          if(histories.length > 0)
          {
            histories.forEach(history => {
              if(tempCheck[history._id] === undefined){
                tempCheck[history._id] = {count : 1, time : history.query_time, numWords : history.query_keyword.split(' ').length};
              }
              else
              tempCheck[history._id].count++;
            })
          }
          else {
            return false
          }
        })
        for( let [key, value] of Object.entries(tempCheck)){
          if(value.count === numWords && value.numWords == numWords){
            this.dupMsg = "중복된 검색 이력이 있습니다. <br /> (검색 시간 : "+value.time + ")<br /> 계속 검색 하시겠습니까?";
            this.dupDialog = true;
            console.log('KEY', key);
            return true
          }
        }
        // tempCheck,keyws.
        //this.$store.commit('showSnack', "키워드를 입력해주세요")
      },
      checkDuplication(word){
        if(this.searches.filter(w => w.word === word).length > 1)
        return false
        else
        return true
      },
      addSearchItem(){
        this.searches.push({word:"", type:"AND"})
      },
      openSiteDialog() {
        //store site flags temporary
        this.siteDialog = true;

        this.tempSelected = this.selected;
        // for (let site in this.sites) {
        //   this.sites[site] = this[site]
        // }
      },
      closeSiteDialog() {
        //restore site flags
        this.siteDialog = false;
        this.selected = this.tempSelected;
        // for (let site in this.sites) {
        //   this[site] = this.sites[site]
        // }
      },
      checksites(){
        console.log("before sites : ",this.selected)
        for (let site in this.selected) {
          // console.log("site:",this.selected[site].site)
        if (this.selected[site].site == "SCOPUS" || this.selected[site].site == "WOS"){
          return false
        }
      }
      return true
    },
    checkKor(str){
     const regExp = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
     if(regExp.test(str)){
         return true;
     }else{
         return false;
     }
 },
    removeEnsites(){
      for (let site = 0; site< this.selected.length; site++) {
        //console.log("site:",this.selected[site].site)
        if (this.selected[site].site == "SCOPUS"||this.selected[site].site == "WOS"){
          this.selected.splice(site,1);
          site--;
          console.log("after site:",this.selected)
      }
    }

    },

    }
  }




  </script>
