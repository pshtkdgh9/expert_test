<template>
  <v-layout class="pa-1 layout d-flex flex-column pa-1" >
    <template class="d-flex"  >
<v-row class="ma-2 d-flex">
        <p class="text-left font-weight-bold text-h5"  >
          {{getIgName}}
        </p>
        <v-spacer></v-spacer>

</v-row>

<v-row class="ma-2 d-flex">
        <p class="text-h8">
          {{getIgResult}}
        </p>

        <v-spacer></v-spacer>

</v-row>

<v-row>
  <v-col md="2">
    <v-btn class="ml-2" @click="setFilter()" :disabled="filterDis">필터 적용</v-btn>
  </v-col>
        <v-col cols="12" md="5" class="pl-8">

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
        <v-col cols="4" md="3" class="mr-8">

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
        <v-row align="center" justify="center">

          <v-col cols="20" md="11">
            <v-spacer />
            <v-card color="#B3D4FB">
              <component :is="comp" :lgSize="3" :itemsPerPage="10" ></component>
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
        <v-spacer></v-spacer>
        <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-width="100"
        offset-x
        >
        <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="indigo"
          class="ml-6"
          dark
          v-bind="attrs"
          v-on="on"
          @click="getRankInsts2()"
        >
          기관 랭킹
        </v-btn>
        </template>
        <v-card>
          <v-list two-line>
            <template v-for="(item, value, index) in getRankInsts">
              <v-subheader
                v-if="item.header"
                :key="item.header"
              >
                {{ item.header }}
              </v-subheader>
              <v-divider
                v-else-if="item.divider"
                :key="index"
              ></v-divider>
              <v-list-item
                v-else
                :key="item"
              >
                <v-list-item-content>
                  <v-list-item-title v-html="item"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
          </v-menu>

  </v-row>
</template>

<v-layout row wrap>
  <v-row>
    <!-- :options.sync="options" -->

<v-col cols="2">
        <!-- <v style="width:250px" max-cols ="2" > -->

        <!-- <v-expansion-panels
      v-model="panel"

      multiple
    > -->
    <v-tabs v-model="tab" fixed-tabs >
         <v-tab style="width:100px" class="text-subtitle-2" v-for="(v, pp, idx) in getFilters" :key="idx">{{pp}} Filter</v-tab>

          <v-tab-item v-for="(v, pp, idx) in getFilters" :key="idx">
      <v-card>
    <v-list
        subheader

class="overflow-y-auto"

    max-height="300"
     v-for="(fil, idx) in v" :key="idx"

   >

   <v-subheader  style="position : sticky; top:0; z-index:1; background: #b3d4fc; background-color : #b3d4fc;">{{fil.v}}</v-subheader>
     <v-spacer></v-spacer>

     <v-list-item-group

      v-model="fil.selected"
       multiple
     >
     <v-list-item  v-for="(vv, kk, iidx) in fil.list" :key="iidx" active-class="text--accent-1"  >
     <template v-slot:default="{ active }" class="overflow-y-auto">
           <v-list-item-content >
             <v-list-item-title  style="font-size: 0.8em;" class="text-left text-wrap" >{{getValue(kk,vv,fil.k)}}</v-list-item-title>
           </v-list-item-content>

           <v-list-item-action>
             <v-checkbox  :input-value="active" ></v-checkbox>
           </v-list-item-action>
         </template>


       <!-- <v-list-item v-for="(item, idx) in fil.list" :key="idx" active-class="text--accent-4">
         <template v-slot:default="{ active }">
           <v-list-item-action>
             <v-checkbox v-model="selected" :input-value="active" :label="item" :value="item"></v-checkbox>
           </v-list-item-action>
         </template> -->
       </v-list-item>
     </v-list-item-group>
     <v-divider></v-divider>

   </v-list>

   </v-card>
 </v-tab-item>


</v-tabs>
<!-- </v> -->
</v-col>

   <!-- :itemsPerPage="ipg"
   :expanded.sync="expanded"
show-expand
 -->
  <v-col cols="10" max-width="250px">
   <v-tabs horizontal>
     <v-tab>
       Domestic
     </v-tab>
     <v-tab>
       International
     </v-tab>
     <v-tab-item>
       <v-card flat>
            <v-card-text>


            <!-- <v-tab style="width:250px" class="text-subtitle-2" v-for="contry in ContryFilters" :key="contry">{{contry}}</v-tab>
          </v-tabs> -->
          <!-- <v-tabs-items v-model="tab">
          <v-tab-item
            v-for="contry in ContryFilters"
            :key="contry"
            > -->
    <v-data-table
        ref="vuetable"
        :headers="headers"
        :items="getDomesticIgs"
        :server-items-length="getDomesticTotal()"
        :options.sync="options"
        :expanded.sync="expanded"
        item-key="_id"
        :loading = "loading"
        show-expand
        class="elevation-1"
        @item-expanded="loadDetails"
        multi-line
        :footer-props="{
    'items-per-page-options': [10, 20, 30, getDomesticTotal()]}">
      <template v-slot:item.inst="{ item }">
        <v-tooltip bottom>
       <template v-slot:activator="{ on, attrs }">
     <span
       v-bind="attrs"
       v-on="on"
       v-if="item.inst.length <20"
     >{{item.inst}}</span>
     <span
       v-bind="attrs"
       v-on="on"
       v-else>
     {{item.inst.substring(0,20)+"..."}}</span>
   </template>
   <span
   v-if="item.inst.length >20">{{item.inst}}</span>
   </v-tooltip>
      </template>
       <template v-slot:item.LDA="{ item }">
         <span>{{makeLdaList(item.LDA)}}</span>
    </template>
       <template v-slot:item.totalCoop="{ item }">
         <v-tooltip bottom v-if="parseInt(item.totalCoop) > 0">
        <template v-slot:activator="{ on, attrs }">
         <span
         v-bind="attrs"
         v-on="on"
         >{{item.totalCoop}}</span>
         </template>
         <span>{{makeCoopList(item.coopList)}}</span></v-tooltip>
       </template>
       <template v-slot:item.ngvCoop="{ item }">
         <span>{{item.ngvCoop}}</span>
    </template>
       <template v-slot:item.score="{ item }">
       <v-speed-dial
      direction="left"
      :open-on-hover="true"
      transition="slide-x-transition">
    <template v-slot:activator>
      <v-btn
        color="blue darken-2"
        dark
        fab
        x-small
        class="pa-5"
        >
        {{item.score}}
      </v-btn>
    </template>
    <v-btn
      fab
      dark
      x-small
      color="green"
      class="pa-5"
      style="width:65px">
      주제적합도  <br />{{(item.factor.acc*30).toFixed(1)}}
    </v-btn>
    <v-btn
      fab
      dark
      x-small
      color="indigo"
      class="pa-5">
      생산성  <br />{{(item.factor.qunt*30).toFixed(1)}}
    </v-btn>
    <v-btn
      fab
      dark
      x-small
      color="purple"
      class="pa-5">
  품질  <br />{{(item.factor.qual*30).toFixed(1)}}
    </v-btn>
    <v-btn
      fab
      dark
      x-small
      color="teal lighten-3"
      class="pa-5"

    >
협업도  <br />{{(item.factor.coop*10/item.max_coop).toFixed(1)}}

    </v-btn>
   </v-speed-dial>
   </template>

      <template v-slot:item.webSearch="{ item }">
        <a :href="item.webSearch" target="_blank">검색</a>
       </template>


       <template v-slot:expanded-item="{ item}" style="maxWidth : 500px">
         <td :colspan="headers.length"  style="maxWidth : 500px" >
          <v-list
            subheader
            three-line
            style="width : 100%"
          >
      <template v-for="(raw, _idx) in item.raw">
     <v-divider inset :key="raw.idx"></v-divider>
     <v-subheader inset :key="raw.site+raw.id" v-if="_idx == 0 && raw.site == 'NTIS'">연구 과제
       <div class="text-center">
      <v-dialog
        v-model="dialog"
        width="500"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-col cols="5" md="2">
            <v-btn
              color="blue"
              class="ml-6"
              dark
              v-bind="attrs"
              v-on="on"
              @click="getNtisAPI(item.NTIS.A_id)"
            >
              저자 정보
            </v-btn>
        </v-col>
        </template>

        <v-card v-if="getAuthorurl.length == 0" >
          <v-card-title  class="text-h5 grey lighten-2">
            {{item.name}}
          </v-card-title>

          <v-card-text>
            {{item.inst}}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              @click="dialog = false"
            >
              CLOSE
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card
        v-else>
          <v-card-title  class="text-h5 grey lighten-2">
            {{item.name}}
            <div>({{getAuthorurl[0].Ename}})</div>
            <v-spacer></v-spacer>
            <a :href="getAuthorurl[0].ntis_URL" target="_blank">more</a>
            <v-btn :ripple="false" icon color="black" id="no-background-hover"
            :href="homepage_url(getAuthorurl[0].Homepage)" target="_blank">
            <v-icon>
            home
            </v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div
            class="text-h5"
            align="left">학력</div>
            <v-divider class="mx-3"></v-divider>
            <v-list
            class="wrap-text">
              <template v-for="(item, value, index) in getAuthorurl[0].academic_background">
                <v-subheader
                  v-if="item.header"
                  :key="item.header"
                >
                  {{ item.header }}
                </v-subheader>
                <v-divider
                  v-else-if="item.divider"
                  :key="index"
                ></v-divider>
                <v-list-item
                  v-else
                  :key="item"
                >
                  <v-list-item-content>
                    <v-list-item-title >
                      <div style="white-space:pre-wrap">{{item}}</div>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
            <div
            class="text-h5"
            align="left">경력</div>
            <v-divider class="mx-4"></v-divider>
            <v-list
            align="left">
              <template v-for="(item, value, index) in getAuthorurl[0].Career">
                <v-subheader
                  v-if="item.header"
                  :key="item.header"
                >
                  {{ item.header }}
                </v-subheader>
                <v-divider
                  v-else-if="item.divider"
                  :key="index"
                ></v-divider>
                <v-list-item
                  v-else
                  :key="item"
                >
                  <v-list-item-content>
                    <v-list-item-title >
                      <div style="white-space:pre-wrap">{{item}}</div>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
          </v-card-text>


          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              @click="dialog = false"
            >
              CLOSE
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
        </v-subheader>
     <v-subheader :key="raw.id" inset v-if="(_idx == 0 && raw.site !='NTIS') ||( _idx!=0 && item.raw[_idx-1].site == 'NTIS' && raw.site !='NTIS')">논문</v-subheader>
     <v-list-item
     :key="raw._id"
      >
      <v-list-item-avatar>
          {{raw.idx}}
        </v-list-item-avatar>

      <v-list-item-content v-if="raw.site=='NTIS'">
         <v-list-item-title  class="text-sm-left">{{raw.koTitle}}
          / {{ raw.odAgency }} / 연구책임자({{raw.mng}}) / {{transFund(raw.totalFund)}}
         </v-list-item-title>

         <v-list-item-subtitle class="text-sm-left" >
           과제키워드 : {{raw.enKeyword}} /
           연구기간 : {{ raw.prdStart.slice(0,4)}} ~ {{raw.prdEnd.slice(0,4)}} /
           <v-tooltip bottom>  <template v-slot:activator="{ on, attrs }">
        <span
          v-bind="attrs"
          v-on="on"
          class="ecoration-underline"
        >참여연구자</span>
      </template>

      <span>{{raw.rsc}}</span></v-tooltip> : {{(parseInt(raw.cntRscMan)+parseInt(raw.cntRscWom))}}명 /
      <v-tooltip bottom>  <template v-slot:activator="{ on, attrs }">
      <span
      v-bind="attrs"
      v-on="on"
      class="text-decoration-underline"
      >요약</span>
      </template>

      <span>{{raw.absAbs}}</span></v-tooltip> /
      <v-btn text color="primary" :href="kvs[raw.site].link+raw.id" target="_blank">
          {{raw.site}}
        </v-btn>
         </v-list-item-subtitle>
       </v-list-item-content>

       <v-list-item-content v-if="raw.site == 'SCOPUS'">
         <v-list-item-title  class="text-sm-left">
          <div style="white-space:pre-wrap">{{raw.title}} / {{raw.journal}} / {{raw.issue_year}}</div>
         </v-list-item-title>

         <v-list-item-subtitle class="text-sm-left" >

           저자 : {{raw.author}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
           <v-tooltip bottom>
             <template v-slot:activator="{ on, attrs }">
           <span
             v-bind="attrs"
             v-on="on"
             class="text-decoration-underline"
           >요약</span>
         </template>

         <span>{{raw.abstract}}</span></v-tooltip>
         /<v-btn text color="primary" :href="raw.link+raw.id" target="_blank">{{raw.site}}
         </v-btn></v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-content v-if="raw.site == 'WOS'">
          <v-list-item-title  class="text-sm-left">
        <div style="white-space:pre-wrap">{{raw.title}} / {{raw.issue_inst}} / {{raw.issue_year}}</div>
            </v-list-item-title>

          <v-list-item-subtitle class="text-sm-left" >

            저자 : {{raw.author}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
            <span
              v-bind="attrs"
              v-on="on"
              class="text-decoration-underline"
            >요약</span>
          </template>

          <span>{{raw.abstract}}</span></v-tooltip>
          /<v-btn text color="primary" :href="kvs[raw.site].link+':'+raw.id" target="_blank">
            {{raw.site}}
          </v-btn>
        </v-list-item-subtitle>
         </v-list-item-content>

       <v-list-item-content v-if="raw.site == 'SCIENCEON' || raw.site == 'DBPIA'|| raw.site == 'KCI'">
          <v-list-item-title  class="text-sm-left">{{raw.title}} / {{raw.issue_inst}} / {{raw.issue_year}}
          </v-list-item-title>

          <v-list-item-subtitle class="wrap-text" >

            저자 : {{makeAuthorName(raw.author, raw.originalName)}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
            <span
              v-bind="attrs"
              v-on="on"
              class="text-decoration-underline"
            >요약</span>
          </template>

          <span>{{raw.abstract}}</span></v-tooltip>
          / <v-btn text color="primary" :href="kvs[raw.site].link+raw.id" target="_blank">
            {{raw.site}}
          </v-btn>
          </v-list-item-subtitle>

        </v-list-item-content>

       <!-- <v-list-item-action>
         <v-btn icon>
           <v-icon color="grey lighten-1">mdi-information</v-icon>
         </v-btn>
       </v-list-item-action> -->

     </v-list-item>

       </template>
  </v-list>

</td>


<!-- <v-row>
         <td :colspan="headers.length">

         <v-simple-table>

               <template v-slot:default>
                 <thead>
                   <tr>
                     <th>
                       순번
                     </th>
                     <th>제목</th>
                     <th>키워드</th>
                     <th>공저자/참여연구원</th>
                     <th>학회명/지원기관</th>
                     <th>날짜</th>
                     <th>요약</th>
                     <th>웹 연결</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="raw in getIgRaw(item.idx)" :key="raw.idx">
                      <td>{{ raw.idx }}</td>
                     <td>{{raw[kvs[raw.site].title]}}</td>
                     <td>{{raw[kvs[raw.site].keyword]}}</td>
                     <td>{{raw[kvs[raw.site].author]}}</td>
                     <td>{{ raw[kvs[raw.site].j] }}</td>
                     <td>{{ raw[kvs[raw.site].y] }}</td>
                     <td>요약보기</td>
                     <td><a :href="kvs[raw.site].link+raw.id" target="_blank">{{raw.site}}</a></td>
                   </tr>
                 </tbody>
               </template>
             </v-simple-table>
           </td>
           </v-row> -->
       </template>
      </v-data-table>
  </v-card-text>
        </v-card>
    </v-tab-item>
    <v-tab-item>
      <v-card flat>
           <v-card-text>


           <!-- <v-tab style="width:250px" class="text-subtitle-2" v-for="contry in ContryFilters" :key="contry">{{contry}}</v-tab>
         </v-tabs> -->
         <!-- <v-tabs-items v-model="tab">
         <v-tab-item
           v-for="contry in ContryFilters"
           :key="contry"
           > -->
   <v-data-table
       ref="vuetable"
       :headers="headers"
       :items="getInternationalIgs"
       :server-items-length="getInternationalTotal()"
       :options.sync="options2"
       :expanded.sync="expanded2"
       item-key="_id"
       :loading = "loading2"
       show-expand
       class="elevation-1"
       @item-expanded="loadDetails2"
       multi-line
       :footer-props="{
   'items-per-page-options': [10, 20, 30, getInternationalTotal()]}">
     <template v-slot:item.inst="{ item }">
       <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
    <span
      v-bind="attrs"
      v-on="on"
      v-if="item.inst.length <20"
    >{{item.inst}}</span>
    <span
      v-bind="attrs"
      v-on="on"
      v-else>
    {{item.inst.substring(0,20)+"..."}}</span>
  </template>
  <span
  v-if="item.inst.length >20">{{item.inst}}</span>
  </v-tooltip>
     </template>
      <template v-slot:item.LDA="{ item }">
        <span>{{makeLdaList(item.LDA)}}</span>
   </template>
      <template v-slot:item.totalCoop="{ item }">
        <v-tooltip bottom v-if="parseInt(item.totalCoop) > 0">
       <template v-slot:activator="{ on, attrs }">
        <span
        v-bind="attrs"
        v-on="on"
        >{{item.totalCoop}}</span>
        </template>
        <span>{{makeCoopList(item.coopList)}}</span></v-tooltip>
      </template>
      <template v-slot:item.ngvCoop="{ item }">
        <span>{{item.ngvCoop}}</span>
   </template>
      <template v-slot:item.score="{ item }">
      <v-speed-dial
     direction="left"
     :open-on-hover="true"
     transition="slide-x-transition">
   <template v-slot:activator>
     <v-btn
       color="blue darken-2"
       dark
       fab
       x-small
       class="pa-5"
       >
       {{item.score}}
     </v-btn>
   </template>
   <v-btn
     fab
     dark
     x-small
     color="green"
     class="pa-5"
     style="width:65px">
     주제적합도  <br />{{(item.factor.acc*30).toFixed(1)}}
   </v-btn>
   <v-btn
     fab
     dark
     x-small
     color="indigo"
     class="pa-5">
     생산성  <br />{{(item.factor.qunt*30).toFixed(1)}}
   </v-btn>
   <v-btn
     fab
     dark
     x-small
     color="purple"
     class="pa-5">
 품질  <br />{{(item.factor.qual*30).toFixed(1)}}
   </v-btn>
   <v-btn
     fab
     dark
     x-small
     color="teal lighten-3"
     class="pa-5"

   >
협업도  <br />{{(item.factor.coop*10/item.max_coop).toFixed(1)}}

   </v-btn>
  </v-speed-dial>
  </template>

     <template v-slot:item.webSearch="{ item }">
       <a :href="item.webSearch" target="_blank">검색</a>
      </template>


      <template v-slot:expanded-item="{ item}" style="maxWidth : 500px">
        <td :colspan="headers.length"  style="maxWidth : 500px" >
         <v-list
           subheader
           three-line
           style="width : 100%"
         >
     <template v-for="(raw, _idx) in item.raw">
    <v-divider inset :key="raw.idx"></v-divider>
    <v-subheader inset :key="raw.site+raw.id" v-if="_idx == 0 && raw.site == 'NTIS'">연구 과제
      <div class="text-center">
     <v-dialog
       v-model="dialog"
       width="500"
     >
       <template v-slot:activator="{ on, attrs }">
         <v-col cols="5" md="2">
           <v-btn
             color="blue"
             class="ml-6"
             dark
             v-bind="attrs"
             v-on="on"
             @click="getNtisAPI(item.NTIS.A_id)"
           >
             저자 정보
           </v-btn>
       </v-col>
       </template>

       <v-card v-if="getAuthorurl.length == 0" >
         <v-card-title  class="text-h5 grey lighten-2">
           {{item.name}}
         </v-card-title>

         <v-card-text>
           {{item.inst}}
         </v-card-text>

         <v-divider></v-divider>

         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn
             color="primary"
             text
             @click="dialog = false"
           >
             CLOSE
           </v-btn>
         </v-card-actions>
       </v-card>
       <v-card
       v-else>
         <v-card-title  class="text-h5 grey lighten-2">
           {{item.name}}
           <div>({{getAuthorurl[0].Ename}})</div>
           <v-spacer></v-spacer>
           <a :href="getAuthorurl[0].ntis_URL" target="_blank">more</a>
           <v-btn :ripple="false" icon color="black" id="no-background-hover"
           :href="homepage_url(getAuthorurl[0].Homepage)" target="_blank">
           <v-icon>
           home
           </v-icon>
           </v-btn>
         </v-card-title>

         <v-card-text>
           <div
           class="text-h5"
           align="left">학력</div>
           <v-divider class="mx-3"></v-divider>
           <v-list
           class="wrap-text">
             <template v-for="(item, value, index) in getAuthorurl[0].academic_background">
               <v-subheader
                 v-if="item.header"
                 :key="item.header"
               >
                 {{ item.header }}
               </v-subheader>
               <v-divider
                 v-else-if="item.divider"
                 :key="index"
               ></v-divider>
               <v-list-item
                 v-else
                 :key="item"
               >
                 <v-list-item-content>
                   <v-list-item-title >
                     <div style="white-space:pre-wrap">{{item}}</div>
                   </v-list-item-title>
                 </v-list-item-content>
               </v-list-item>
             </template>
           </v-list>
           <div
           class="text-h5"
           align="left">경력</div>
           <v-divider class="mx-4"></v-divider>
           <v-list
           align="left">
             <template v-for="(item, value, index) in getAuthorurl[0].Career">
               <v-subheader
                 v-if="item.header"
                 :key="item.header"
               >
                 {{ item.header }}
               </v-subheader>
               <v-divider
                 v-else-if="item.divider"
                 :key="index"
               ></v-divider>
               <v-list-item
                 v-else
                 :key="item"
               >
                 <v-list-item-content>
                   <v-list-item-title >
                     <div style="white-space:pre-wrap">{{item}}</div>
                   </v-list-item-title>
                 </v-list-item-content>
               </v-list-item>
             </template>
           </v-list>
         </v-card-text>


         <v-divider></v-divider>

         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn
             color="primary"
             text
             @click="dialog = false"
           >
             CLOSE
           </v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>
   </div>
       </v-subheader>
    <v-subheader :key="raw.id" inset v-if="(_idx == 0 && raw.site !='NTIS') ||( _idx!=0 && item.raw[_idx-1].site == 'NTIS' && raw.site !='NTIS')">논문</v-subheader>
    <v-list-item
    :key="raw._id"
     >
     <v-list-item-avatar>
         {{raw.idx}}
       </v-list-item-avatar>

     <v-list-item-content v-if="raw.site=='NTIS'">
        <v-list-item-title  class="text-sm-left">{{raw.koTitle}}
         / {{ raw.odAgency }} / 연구책임자({{raw.mng}}) / {{transFund(raw.totalFund)}}
        </v-list-item-title>

        <v-list-item-subtitle class="text-sm-left" >
          과제키워드 : {{raw.enKeyword}} /
          연구기간 : {{ raw.prdStart.slice(0,4)}} ~ {{raw.prdEnd.slice(0,4)}} /
          <v-tooltip bottom>  <template v-slot:activator="{ on, attrs }">
       <span
         v-bind="attrs"
         v-on="on"
         class="ecoration-underline"
       >참여연구자</span>
     </template>

     <span>{{raw.rsc}}</span></v-tooltip> : {{(parseInt(raw.cntRscMan)+parseInt(raw.cntRscWom))}}명 /
     <v-tooltip bottom>  <template v-slot:activator="{ on, attrs }">
     <span
     v-bind="attrs"
     v-on="on"
     class="text-decoration-underline"
     >요약</span>
     </template>

     <span>{{raw.absAbs}}</span></v-tooltip> /
     <v-btn text color="primary" :href="kvs[raw.site].link+raw.id" target="_blank">
         {{raw.site}}
       </v-btn>
        </v-list-item-subtitle>
      </v-list-item-content>

      <v-list-item-content v-if="raw.site == 'SCOPUS'">
        <v-list-item-title  class="text-sm-left">
         <div style="white-space:pre-wrap">{{raw.title}} / {{raw.journal}} / {{raw.issue_year}}</div>
        </v-list-item-title>

        <v-list-item-subtitle class="text-sm-left" >

          저자 : {{raw.author}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
          <span
            v-bind="attrs"
            v-on="on"
            class="text-decoration-underline"
          >요약</span>
        </template>

        <span>{{raw.abstract}}</span></v-tooltip>
        /<v-btn text color="primary" :href="raw.link+raw.id" target="_blank">{{raw.site}}
        </v-btn></v-list-item-subtitle>
       </v-list-item-content>
       <v-list-item-content v-if="raw.site == 'WOS'">
         <v-list-item-title  class="text-sm-left">
       <div style="white-space:pre-wrap">{{raw.title}} / {{raw.issue_inst}} / {{raw.issue_year}}</div>
           </v-list-item-title>

         <v-list-item-subtitle class="text-sm-left" >

           저자 : {{raw.author}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
           <v-tooltip bottom>
             <template v-slot:activator="{ on, attrs }">
           <span
             v-bind="attrs"
             v-on="on"
             class="text-decoration-underline"
           >요약</span>
         </template>

         <span>{{raw.abstract}}</span></v-tooltip>
         /<v-btn text color="primary" :href="kvs[raw.site].link+':'+raw.id" target="_blank">
           {{raw.site}}
         </v-btn>
       </v-list-item-subtitle>
        </v-list-item-content>

      <v-list-item-content v-if="raw.site == 'SCIENCEON' || raw.site == 'DBPIA'|| raw.site == 'KCI'">
         <v-list-item-title  class="text-sm-left">{{raw.title}} / {{raw.issue_inst}} / {{raw.issue_year}}
         </v-list-item-title>

         <v-list-item-subtitle class="wrap-text" >

           저자 : {{makeAuthorName(raw.author, raw.originalName)}} / 키워드 : {{raw.paper_keyword}} /  인용 수 : {{raw.citation}} /
           <v-tooltip bottom>
             <template v-slot:activator="{ on, attrs }">
           <span
             v-bind="attrs"
             v-on="on"
             class="text-decoration-underline"
           >요약</span>
         </template>

         <span>{{raw.abstract}}</span></v-tooltip>
         / <v-btn text color="primary" :href="kvs[raw.site].link+raw.id" target="_blank">
           {{raw.site}}
         </v-btn>
         </v-list-item-subtitle>

       </v-list-item-content>

      <!-- <v-list-item-action>
        <v-btn icon>
          <v-icon color="grey lighten-1">mdi-information</v-icon>
        </v-btn>
      </v-list-item-action> -->

    </v-list-item>

      </template>
 </v-list>

</td>


<!-- <v-row>
        <td :colspan="headers.length">

        <v-simple-table>

              <template v-slot:default>
                <thead>
                  <tr>
                    <th>
                      순번
                    </th>
                    <th>제목</th>
                    <th>키워드</th>
                    <th>공저자/참여연구원</th>
                    <th>학회명/지원기관</th>
                    <th>날짜</th>
                    <th>요약</th>
                    <th>웹 연결</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="raw in getIgRaw(item.idx)" :key="raw.idx">
                     <td>{{ raw.idx }}</td>
                    <td>{{raw[kvs[raw.site].title]}}</td>
                    <td>{{raw[kvs[raw.site].keyword]}}</td>
                    <td>{{raw[kvs[raw.site].author]}}</td>
                    <td>{{ raw[kvs[raw.site].j] }}</td>
                    <td>{{ raw[kvs[raw.site].y] }}</td>
                    <td>요약보기</td>
                    <td><a :href="kvs[raw.site].link+raw.id" target="_blank">{{raw.site}}</a></td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </td>
          </v-row> -->
      </template>
     </v-data-table>
 </v-card-text>
       </v-card>
   </v-tab-item>
  </v-tabs>
    </v-col>
    </v-row>
    </v-layout>
  </v-layout>

  <!-- <template v-slot:expanded-item="{ headers, item}">

    <td :colspan="headers.length" >
      asd
    </td>
  </template> -->




</template>

<script>
export default {
  data() {
    return {
      tab : null,
      loading : false,
      loading2 : false,
      dialog : false,
      filterDis : true,
      panel : [0, 1],
      ylabel : " 년 이후 논문 수집",
      years : 5,
      valid : true,
      comp: 'History',
      searchDialog: false,
      siteDialog: false,
      tempSelected : [],
      selected: [],
      sites: [
        {'site' : 'NTIS', 'canCrawl' : true, 'filter' : true},
        {'site' : 'SCIENCEON', 'canCrawl' : true , 'filter' : true},
        {'site' : 'DBPIA', 'canCrawl' : true , 'filter' :  true},
        {'site' : 'KCI', 'canCrawl' : true, 'filter' :  true },
        {'site' : 'SCOPUS', 'canCrawl' : true, 'filter' : true, 'fab' : false},
        {'site' : 'WOS', 'canCrawl' : false, 'filter' : true, 'fab' : false}

      ],
      operations: ['AND', 'OR', 'NOT'],
      keywords : "",
      searches:[],
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
      filterModel : 1,
      filterMsg : { true : "ALL" , false : 'Korea'},
      kvs : {'NTIS' : {
        "link" : 'https://www.ntis.go.kr/project/pjtInfo.do?pjtId=',
        "title" : "koTitle",
        "keyword" : "koKeyword",
        "author" : "rsc",
        "j" : "odAgency",
        "y" : "prdStart"
      },
      'SCIENCEON' :{
        "link" : 'https://scienceon.kisti.re.kr/srch/selectPORSrchArticle.do?cn=',
    "title" : "title",
    "keyword" : "paper_keyword",
    "author" : "author",
    "j" : "journal",
    "y" : "issue_year"

  }
      , 'DBPIA' : {
        "link":'https://www.dbpia.co.kr/journal/articleDetail?nodeId=',
        "title" : "title",
        "keyword" : "paper_keyword",
          "author" : "author",
            "j" : "journal",
            "y" : "issue_year"
      },
      'KCI' :{
'link' : 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId='
},
  'WOS':{'link' : 'https://www.webofscience.com/wos/woscc/full-record/WOS'

},
'SCOPUS':{"link":"link"}
    },


      expanded: [],
      expanded2: [],
      options : {
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  sortDesc: [],
  groupBy: [],
  groupDesc: [],
  mustSort: false,
  multiSort: false
},
options2 :{
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  sortDesc: [],
  groupBy: [],
  groupDesc: [],
  mustSort: false,
  multiSort: false
},
      initselected : {'project' : {'inst' : [], 'rsc' : [], 'fund' : [], 'year' : []},
'paper' : {'inst' : [], 'year' : [], 'journal' : [], 'lang' : []},
    },
      mStr : {true : '숨기기' ,false : '더보기'},

//       selected : {'project' : {'inst' : [], 'rsc' : [], 'fund' : [], 'year' : []},
// 'paper' : {'inst' : [], 'year' : [], 'journal' : [], 'lang' : []},
//     },
      filterListProject : { "i" : {"value" : "소속", "list" : [] },
"y" : {"value" : "연도", "list" : [] },
"s" : {"value" : "과제규모", "list" : [] }
},
filterListPaper : { "j" : {"value" : "저널명", "list" : ["한국", "콘텐츠"] },
"i" : {"value" : "소속", "list" : [] },
"y" : {"value" : "연도", "list" : [] },
"o" : {"value" : "협업 OEM", "list" : [] },
},
      headers: [
        {
          text: 'No.',
          align: 'start',
          sortable: false,
          value: 'idx',
        },
       {
         text: '성명',
         align: 'start',
         sortable: true,
         value: 'name',
         width:'7%'
       },
       { text: '소속', sortable: true , align: 'center', value: 'inst',width:'20%'},
       { text: '키워드', sortable: false , align: 'center', value: 'LDA', width:'10%'},
       { text: '논문 수', sortable: true , align: 'center',value: 'numPapers', width:'7%'},
       { text: '피인용', sortable: true , align: 'center',value: 'totalCitation', width:'7%'},
       { text: '공동논문', sortable: true , align: 'center',value: 'totalCoop', width:'7%'},
       { text: '최신 년도', sortable: true , align: 'center',value: 'recentYear', width:'7%'},
       { text: '정부 과제', sortable: true, align: 'center',value: 'numProjects', width:'7%'},
       { text: 'NGV 협업', sortable: true , align: 'center',value: 'ngvCoop', width:'7%'},
       { text: 'NGV 지수 ', sortable: true , align: 'center',value: 'score', width:'7%'},
       { text: '웹 검색', sortable: false , align: 'center',value: 'webSearch', width:'7%'},

     ],
     headers_inter: [
       {
         text: 'No.',
         align: 'start',
         sortable: false,
         value: 'idx',
       },
      {
        text: '성명',
        align: 'start',
        sortable: true,
        value: 'name',
        width:'7%'
      },
      { text: '소속', sortable: true , align: 'center', value: 'inst',width:'20%'},
      { text: '키워드', sortable: false , align: 'center', value: 'LDA', width:'10%'},
      { text: '논문 수', sortable: true , align: 'center',value: 'numPapers', width:'7%'},
      { text: '피인용', sortable: true , align: 'center',value: 'totalCitation', width:'7%'},
      { text: '공동논문', sortable: true , align: 'center',value: 'totalCoop', width:'7%'},
      { text: '최신 년도', sortable: true , align: 'center',value: 'recentYear', width:'7%'},
      { text: '정부 과제', sortable: true, align: 'center',value: 'numProjects', width:'7%'},
      { text: 'NGV 협업', sortable: true , align: 'center',value: 'ngvCoop', width:'7%'},
      { text: 'NGV 지수 ', sortable: true , align: 'center',value: 'score', width:'7%'},
      { text: '웹 검색', sortable: false , align: 'center',value: 'webSearch', width:'7%'},

    ],
     headers2: [
       {
         text: 'No.',
         align: 'start',
         sortable: false,
         value: 'idx',
       },
      {
        text: '제목',
        align: 'start',
        sortable: false,
        value: 'title',
      },
      { text: '요2', sortable: false , align: 'center', value: 'abstract' },
      { text: '연구 키워드', sortable: false , align: 'center', value: 'rKeywords' },
      { text: '연구 실적', sortable: false , align: 'center',value: 'numPapers'},
      { text: '협업 이력', sortable: true , align: 'center',value: 'coopHist'},
      { text: '전문가 지수', sortable: true , align: 'center',value: 'score'},
      { text: '네트워크', sortable: false , align: 'center',value: 'network'},
      { text: '웹 검색', sortable: false , align: 'center',value: 'webSearch'},

    ],
    ContryFilters : [ 'Domestic', 'International'],
      itemsPerPageArray: [5, 8, 12],
      // filterStr : { : '(ALL)' ,  false : '(Korea)'}
      page: 1,
      // page2: 1,
      itemsPerPage : 10,
      first : true,
      first2 : true
    }
  },//data() End
  watch: {
    options: {
      handler(){
        if(this.first){
          this.first = false;
        }
        else{
          this.pageReload(0);
          this.filterDis = false;
        }
        //console.log('THIS.PAGE', this.page);
        //console.log('THIS.OPTIONS.PAGE', this.options.page);
        // this.page = this.options.page;
      },
      deep: true
    },
    options2: {
      handler(){
        if(this.first2){
          this.first2 = false;
        }
        else{
          this.pageReload(1);
          this.filterDis = false;
        }
        //console.log('THIS.PAGE', this.page);
        //console.log('THIS.OPTIONS.PAGE', this.options.page);
        // this.page = this.options.page;
      },
      deep: true
    },

  },

  beforeDestroy() {
    this.$store.state.integrations = {'Domestic' : [], 'International':[]};
    this.$store.state.igRaw = {};
    this.$store.state.prevfId = 0;
    this.$store.dispatch('deleteIntegration', this.$store.state.igID);
    this.$store.commit('deleteSelected');
    //this.$store.state.rankinst = [];
  //  this.$store.dispatch('getRankinst', this.$store.state.igID);

    // remove filter data all (keyId)
  },
  created(){
    this.selected = this.sites.filter(site=>site.canCrawl);

    // console.log("created");
    this.startInterval();
    // this.$store.dispatch('getHistories');
    this.$store.commit("setIsMini", true);

    // this.$store.state.isMini
    // console.log('THIS.$STORE.STATE.ISMINI', this.$store.state.isMini);

  },
  destroyed(){
    // console.log("dest");
    clearInterval(this.timer);
  },
  mounted(){
      this.setFilter();
  },
  computed: {
    //search 추가 : selectAll
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
    },
     getSelected(){
      // get(){
        return this.$store.state.selected;
      },
    // getSelected: {
    //   get(){
    //     return this.$store.state.selected;
    //   },
    //   set(value){
    //     console.log('VALUE', value);
    //     // this.$store.state.
    //   }
    //
    // },
    getIgName(){
      return this.$store.state.igKeyword +"( KeyID : "+this.$store.state.igID+" ) ";
    },
    getIgResult(){
      return "검색결과 : "+ this.getIgTotal + "개";
    },
    getIgs() {
      console.log("integrations",this.$store.state.integrations)
      return this.$store.state.integrations;

    },
    getDomesticIgs(){
    console.log("total",this.$store.state.integrations)
    console.log("Domestic",this.$store.state.integrations.Domestic)
    // console.log("after igs:",igs.Domestic,igs.International)
    return this.$store.state.integrations.Domestic;
  },
    getInternationalIgs(){
      console.log("International",this.$store.state.integrations['International'])
      // console.log("after igs:",igs.Domestic,igs.International)
      return this.$store.state.integrations.International;
  },
    getRankInsts() {
      return this.$store.state.rankinst;
    },
    getAuthorurl(){
      return this.$store.state.a_url;
    },

    numberOfPages() {
      return Math.ceil(this.getHistories.length / this.itemsPerPage);
    },
    ipg(){
      return this.itemsPerPage;
    },
    getFilters(){
      return this.$store.state.filters;
    },
    isShowFilter(){
      return (fil, index) =>{
        return fil.f || index < 5;
      };
    },
    getIgTotal(){
      return this.$store.state.igTotal;
    },
    getigDomestic(){
      return this.$store.state.igDomestic;
    },
    getigInternational(){
      return this.$store.state.igInternational;
    },
    getIgRaw(){
      return idx => this.$store.state.igRaw[idx];
    }
  },
  methods: {
    onFilterClick(site){
      console.log('SITE', site);
      this.sheet = false;

    },
    getRankInsts2() {
      console.log("igID",this.$store.state.igID)
    //  return this.$store.dispatch('getDetailHistory', {'id' :this.$store.state.igID});
      this.$store.dispatch('getInstRank',{"keyId": this.$store.state.igID});


    },
    getNtisAPI(A_list){
      console.log("A_list",A_list)
      this.$store.dispatch('getNtisAPI',{"A_list": A_list});
    //   if (this.$store.state.a_url.length > 0){
    //     console.log("a_url",this.$store.state.a_url)
    //   window.open(this.$store.state.a_url,"_blank");
    // }
    //   else{
    //   this.$store.commit('showSnack', "ntis api 정보가 없습니다.");
    //   }
    },
    checkSpecificKey(str) {
      // var specialKey = "[`~#@%$^&*={}':;',\\[\\].<>/?~#￥……&*（）??{}【】‘；：”“'。，、？]‘'";
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
        }
        if (size != idx) rtv += ' '
      })
      rtv = rtv.replace(/\(/g,`"("`)
      rtv = rtv.replace(/\)/g,`")"`)
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
    getScoreString(value){
      if(value > 0.7)
        return "상";
      else if(value > 0.5)
        return "중";
      else
        return "하";

    },
    getInst(item){
      let sites = ['NTIS', 'Scienceon', 'KCI'];
      let rtv = "";
      sites.forEach((site) => {
        if(item[site] !== undefined) {
          rtv += site+":"+item[site].inst+"\n";
        }
      });

      console.log('ITEM', item);
      return rtv;

    },
    transFund(fund){
      return fund/1000000  + '백만원';
    },

    // getLink(site, id){
    //
    // },
    async loadDetails({item}){

      if(this.getIgRaw(item.idx) === undefined){
        // console.log('CONDITION PASSED');
        // console.log('ITEM', item);
        // item.raws = [{"title" : "Test"}];
        // console.log("expand");
        // this.expanded
        console.log('THIS.EXPANDED', this.expanded);
        // let t = this;
        this.expanded.filter(x=> x==item);


      //   this.$store.dispatch('getIntegrationRaw', item).then(()=>{
      //     t.expanded.push(item);
      // });
        // .then(res => {item.raws = res;
        //   console.log('ITEM.RAWS', res);
        //   console.log('  T.$REFS.VUETABLE',   t.$refs.vuetable);
        //   // t.$refs.vuetable.refresh();
        //   t.$forceUpdate();
        // });
      }else{
          console.log('ITEM.RAWS', item);
      }
    },
    async loadDetails2({item}){

      if(this.getIgRaw(item.idx) === undefined){
        // console.log('CONDITION PASSED');
        // console.log('ITEM', item);
        // item.raws = [{"title" : "Test"}];
        // console.log("expand");
        // this.expanded
        console.log('THIS.EXPANDED', this.expanded2);
        // let t = this;
        this.expanded2.filter(x=> x==item);


      //   this.$store.dispatch('getIntegrationRaw', item).then(()=>{
      //     t.expanded.push(item);
      // });
        // .then(res => {item.raws = res;
        //   console.log('ITEM.RAWS', res);
        //   console.log('  T.$REFS.VUETABLE',   t.$refs.vuetable);
        //   // t.$refs.vuetable.refresh();
        //   t.$forceUpdate();
        // });
      }else{
          console.log('ITEM.RAWS', item);
      }
    },
    getTotal(){
      // console.log('THIS.GETIGS', this.getIgs);
      // if (this.getIgTotal >50)
      //   return 50;
      // else
        return this.getIgTotal
    },
    getDomesticTotal(){
      return this.getigDomestic
    },
    getInternationalTotal(){
      return this.getigInternational
  },
  pageReload(flag){
    let data = {};
    data.keyId = this.$store.state.igID;
    data.flag= flag;
    if(flag == 0){
      data.options = this.options;
      this.loading = true;
    }
    else{
      data.options = this.options2;
this.loading2 = true;

    }

    data.fId = this.$store.state.prevfId;

    let t = this;
    this.$store.dispatch('getReloadPage', data).then(()=>{
      if(t.flag == 0)
      t.loading = false;
      else {
        t.loading2 = false;
      }

    });
},
    setFilter(){
      // this.selected

      // this.$test
      this.filterDis = true;
      console.log('THIS.$TEST', this.$refs['test']);
      console.log('THIS.SELECTED', this.selected);


      // let data = Object.assign({}, this.selected);
      console.log("Test Filter");
      // this.options
      console.log('THIS.OPTIONS', this.options);

      let data = {};
      // console.log('IPG()', this.itemsPerPage);
      this.fisrt = false;
      this.first2 = false;

      data.keyId = this.$store.state.igID;
      data.options = this.options;
    //  data.options2 = this.options2;
      data.options.page = 1;
//      data.options2.page = 1;
      let t = this;
      // t.selected = t.initselected;
      this.loading = true;
      this.loading2 = true;
      this.$store.dispatch('getIntegrationResult', data).then((sel) =>{
        console.log('SEL', sel);
        t.loading = false;
        t.loading2 = false;
        t.filterDis = false;
        // sel.filters


        // t.selected = sel.selected;
        // console.log('SEL', sel.selected.paper);
          // t.selected = sel;
          // t.$forceUpdate()
          // t.$refs['test'].$listeners.change();
      });
    },
    setFlag(pp, k){
      this.$store.state.filters[pp][k].f = !this.$store.state.filters[pp][k].f ;

      // fil
    },

    refreshHistories() {
      this.$store.dispatch('getHistories', 0)
    },
     onScroll () {

     },
     makeAuthorName(authors, insts){
       let a = authors.split(";");
       if (insts == undefined){
         return authors
       }
       else{
         let i = insts.split(";");
         let rtv = "";
         a.forEach((name, idx) => {
           if(idx != a.length-1){
             rtv += name+"("+i[idx]+");";
          }
         });
         return rtv;
}
       },
     makeCoopList(coopList){
       //console.log("cooplist",coopList)
       return coopList.join(",").replace("[","");
     },
     // makeLdaList(lda){
     //   if (lda == null || lda[0] == null){
     //     return null
     //   }
     //   let lda2 = [lda[0]]; //eslint-disable-line no-unused-vars
     //   lda2 = lda2.join(', ').replace(/[0-9]/g,"").replace(/;/gi,"");
     //   //console.log("lda2",typeof(lda[0]))
     //  return lda2
     // },
     makeLdaList(lda){
       if (lda == null || lda[0] == null){
         return null
       }
       if (lda.length > 1){
       lda[0] = lda[0].replace(/[0-9]/g,"").replace(/;/g,"").replace(/[%]/g,"");
       lda[1] = lda[1].replace(/[0-9]/g,"").replace(/;/g,"").replace(/[%]/g,"");
       let lda2 = [lda[0],lda[1]]; //eslint-disable-line no-unused-vars
       lda2 = lda2.join('; ');
       // lda2 = lda2.join(', ')
       //console.log("lda2",typeof(lda[0]))
      return lda2
    }
     },
     getValue(k, v, l){
       if(l!='year'){
         return k+' ('+v+')';
       }else{
         // v
         // console.log('V', v);
         return v[0]+' ('+v[1]+')';
       }
     },
     checksites(){
       //console.log("sites : ",this.siteselected,this.siteselected.length)
       for (let site in this.selected) {
         //console.log("site:",this.siteselected[site].site)
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
  homepage_url(homepage){
    homepage = "http://"+homepage
    //console.log("homepage",homepage)
    return homepage;
},

    //remove code

     //remove code




  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.v-list {
   border-left: 1px solid red
}
.sticky {
  width: 100%;
  position: sticky;
  min-height: 60px;
  text-align: center;
  button {
  position: absolute;
  bottom: 10px;
  transform: translateX(-50%);
}
}
.wrap-text {
  -webkit-line-clamp: unset !important;
  text-align: left;
}
</style>
