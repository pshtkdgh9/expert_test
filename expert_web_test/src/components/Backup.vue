<v-data-iterator :items="getHistories"
                 :items-per-page.sync="itemsPerPage"
                 :page="page"
                 hide-default-footer>
  <template v-slot:default="props">
      <v-row>
        <v-col
          v-for="(item,idx) in props.items"
          :key="idx"
          cols="12"
          sm="12"
          md="12"
          :lg="lgSize"

        >
          <v-card :color="getColor(item.sites[0].state)">
            <v-card-title class="subheading font-weight-bold justify-center">{{ '검색어 : '+ item.query_keyword }}</v-card-title>
            <v-card-subtitle>{{ '검색 시간 : '+ item.query_time }} </v-card-subtitle>
            <!-- <v-divider></v-divider> -->
            <!-- class="justify-end" -->
            <v-card-actions  >

              <v-container >
                  <v-layout>
                    <v-flex xs12 flexbox>

                      <!-- <v-btn small v-show="isPauseShow(item.status)"  class="ma-1">
                        <v-icon >pause</v-icon>
                      </v-btn>
                      <v-btn  small v-show="isStopShow(item.status)" class="ma-1" >
                        <v-icon >stop</v-icon>
                      </v-btn>
                      <v-btn small v-show="isRunShow(item.status)"  class="ma-1">
                        <v-icon >play_arrow</v-icon>
                      </v-btn> -->
                      <v-btn link small class="ma-1" @click="getDetailHistory(item._id)">More</v-btn>
                    </v-flex>
                  </v-layout>
                </v-container>

            </v-card-actions>
            <v-list dense>
              <v-list-item
                v-for="(key) in Object.keys(item.sites)"
                :key="key"
              >
                <v-list-item-content >{{ item.sites[key].site }}:</v-list-item-content>
                <v-list-item-content class="align-end" >{{ getStatus(item.sites[key].state) + '(' + item.sites[key].progress + '%)' }}</v-list-item-content>
                <!-- <v-list-item-action width="100%">
                  <v-progress-linear
                    :v-model=item[key]
                    height="25"
                    width="100"
                    >
                    <strong>{{ Math.ceil(item[key]) }}%</strong>
                  </v-progress-linear>
                </v-list-item-action> -->
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

  <template v-slot:footer>
      <v-row class="mt-2" align="center" justify="center">
        <span class="grey--text">Items per page</span>
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
              dark
              text
              color="primary"
              class="ml-2"
              v-on="on"
            >
              {{ itemsPerPage }}
              <v-icon>expand_more</v-icon>
            </v-btn>
          </template>
  <v-list>
    <v-list-item v-for="(number, index) in itemsPerPageArray"
                 :key="index"
                 @click="updateItemsPerPage(number)">
      <v-list-item-title>{{ number }}</v-list-item-title>
    </v-list-item>
  </v-list>
  </v-menu>

  <v-spacer></v-spacer>

  <span class="mr-4
          grey--text">
          Page {{ page }} of {{ numberOfPages }}
        </span>
  <v-btn fab dark
         color="blue darken-3"
         class="mr-1"
         @click="formerPage">
    <v-icon>chevron_left</v-icon>
  </v-btn>
  <v-btn fab dark
         color="blue darken-3"
         class="ml-1"
         @click="nextPage">
    <v-icon>chevron_right</v-icon>
  </v-btn>
  </v-row>
  </template>
</v-data-iterator>





<v-row align="center" justify="end" class="mr-6">
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
      color="primary"
      dark
      v-bind="attrs"
      v-on="on"
      >
      기타 기능
    </v-btn>
  </template>
  <v-list>
    <v-list-item
    v-for="(menu, index) in menus"
    :key="index"
    @click="menuCb(index)"
    >
    <v-list-item-title>{{ menu }}</v-list-item-title>
  </v-list-item>
</v-list>
</v-menu>

<!-- <v-btn class="mx-4" color="primary" @click="openFileImport">IF File Update</v-btn> -->

<v-dialog v-model="instCrawlerDialog" max-width="600px">
<v-card>
  <v-card-title>
    <span class="headline">DBPIA 소속 수집기</span>
  </v-card-title>
  <v-card-subtitle class="align-self-start mt-2">
    DBPIA 소속 데이터를 수집 - (논문 수집기와 별도 수행)
  </v-card-subtitle>
  <v-card-text>
    수집 현황 ({{crawlStatus}})
    <v-btn icon color="grey" class="mr-2" @click="refreshCrawlStatus()">
      <v-icon>refresh</v-icon>
    </v-btn>
    <v-spacer>
    </v-spacer>
    {{numComp}} 명(수집 전문가 수) / {{total}} 명(전체 전문가 수)
    <v-spacer>
    </v-spacer>
    예상 시간 : {{estimatedTime}}
  </v-card-text>
  <v-card-actions>

    <v-container align-end>
      <v-row
      class="fill-height"

      justify="center"
      >

      <v-progress-linear
      :value="crawlProgress"
      height="25"
      >
      <template v-slot="{ value }">
        <strong>{{ Math.ceil(value) }}%</strong>
      </template>
    </v-progress-linear>
  </v-row>
  <v-row
  class="fill-height mt-2"
  justify="end"
  ><v-btn color="blue darken-1" right @click="sendCrawlRequest()">{{crawlBtnText}}</v-btn>
</v-row>
</v-container>


</v-card-actions>
</v-card>
</v-dialog>



<v-dialog v-model="fileDialog" max-width="600px">
<v-card>
<v-card-title>
  <span class="headline">(국내)IF File 설정</span>
</v-card-title>
<v-card-subtitle class="align-self-start">
  (출처 : <a target="_black" rel="noopener noreferrer" href='https://www.kci.go.kr/kciportal/po/search/poCitaSearList.kci'>KCI</a> )
</v-card-subtitle>
<v-card-text>
  <v-file-input outlined color="success" label="KCI File Import" v-model="file.kci">
  </v-file-input>
</v-card-text>
<v-card-actions>
  <v-spacer></v-spacer>
  <v-btn color="blue darken-1" right @click="importFile('kci')">Upload</v-btn>
</v-card-actions>
</v-card>


<v-card>
<v-card-title>
  <span class="headline">(국외)IF File 설정</span>
</v-card-title>
<v-card-subtitle class="align-self-start">
  (출처 : <a target="_black" rel="noopener noreferrer" href='https://jcr.clarivate.com/JCRJournalHomeAction.action'>SCI</a> )
</v-card-subtitle>
<v-card-text>
  <v-file-input outlined color="success" label="SCI File Import" v-model="file.sci">
  </v-file-input>
</v-card-text>
<v-card-actions>
  <v-spacer></v-spacer>
  <v-btn color="blue darken-1" right @click="importFile('sci')">Upload</v-btn>
</v-card-actions>
</v-card>
</v-dialog>


</v-row>


menuCb(index){
  switch (index) {
    case 0:
    this.fileDialog = true;
    // this.openFileImport();
    break;
    case 1 :

    // this.crawlProgress = 36;
    this.instCrawlerDialog = true;
    break;
    default:
  }
},

setCrawlData(_data){
  // console.log('RESULT', result);
  let {crawled, total, status } = _data;

  this.total = total;
  this.numComp = crawled;
  this.crawlStatus = this.makeStatusString(status);
  this.crawlBtnText = this.makeBtnString(status);
  let tempSec = (total - crawled) * 15;
  let hour = parseInt((tempSec / 3600));
  tempSec -=  hour * 3600;

  let min =  parseInt((tempSec / 60));
  tempSec -=  min * 60;

  this.estimatedTime = hour +"시간 " + min + "분 " +tempSec +"초";
  this.crawlProgress = crawled / total;
},
makeBtnString(_bFlag){
  return _bFlag ? "중지 요청" : "수집 요청";
},
makeStatusString(_status){
  switch (_status) {
    case 0:
    return "중지 됨";

    case 1 :
    return "수집 중";

  }
},
sendCrawlRequest(){
  // console.log("test");
  let flag = 0;
  let isCrawl = this.isCrawl;
  let tt = this;
  this.$store.dispatch('sendCrawlRequest', {isCrawl, flag}).then(result =>{
    console.log('RESULT', result);
    tt.setCrawlData(result.data);
    this.isCrawl = !this.isCrawl;
  });
},
refreshCrawlStatus(){
  let flag = 1;
  let isCrawl = this.isCrawl;
  let tt = this;
  this.$store.dispatch('sendCrawlRequest', {isCrawl, flag}).then(result =>{
    console.log('RESULT', result);
    tt.setCrawlData(result.data);
  });
},
openDBpiaInstCrawler(){
  console.log("test");
},
// openFileImport(){
//   this.fileDialog = true;
// },
importFile(bType){

  if( this.file[bType]){
    let self = this;
    let reader = new FileReader();
    reader.onload = function() {
      let data  = reader.result;
      let wb = XLSX.read(data, {type : 'binary'});

      wb.SheetNames.forEach((sn) => {
        let rows  = XLSX.utils.sheet_to_json(wb.Sheets[sn]);
        // console.log('ROWS', rows);
        let flag = true;
        if(bType == 'sci'){
          if(rows[0].__EMPTY_1 != 'Full Journal Title' && rows[0].__EMPTY_2 !='Journal Impact Factor')
          flag = false;
        }
        else{
          rows.some((row, i) => {
            if(row['발행기관'] == undefined || row['(자기인용제외) KCI IF (2년)'] == undefined)
            {
              console.log('error line : ', i);
              flag = false;
              return true;
            }
          });
        }
        if(flag){
          self.$store.dispatch('uploadIFFile', { rows, type : bType });
        }else{
          self.$store.commit('showSnack', 'File Type error');
        }
      });
    };
    reader.onerror = function(ex) {
      self.$store.commit('showSnack', ex);
    };
    reader.readAsBinaryString(this.file[bType]);
  }
},
