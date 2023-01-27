<template lang="html">
  <v-container >
    <v-row align="center" justify="center" >
      <v-col cols="9">
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
          class="fill-height mt-4"
          justify="end"
          ><v-btn color="primary" right @click="sendCrawlRequest()">{{crawlBtnText}}</v-btn>

        </v-row>

      </v-container>


    </v-card-actions>
  </v-card>
</v-col>
</v-row>
</v-container>
</template>
<script>


export default {

  data() {
    return {
      statusString : { 0 : { 'status' : '중지 됨', 'btn' : '수집 요청'}, 1 : { 'status' : '수집 중', 'btn' : '중지 '} },
      crawlBtnText : '수집 요청',
      isCrawl : false,
      crawlStatus : '알 수 없음',
      estimatedTime : '',
      crawlProgress : 0,
      numComp : 0,
      total : 0,

    }
  }, //data() End

  created(){
      this.$store.commit("setIsMini", false);
  },

  methods: {

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

      this.crawlStatus  = this.statusString[status].status;
      this.crawlBtnText = this.statusString[status].btn;


      let tempSec = (total - crawled) * 10;
      let hour = parseInt((tempSec / 3600));
      tempSec -=  hour * 3600;

      let min =  parseInt((tempSec / 60));
      tempSec -=  min * 60;

      this.estimatedTime = hour +"시간 " + min + "분 " +tempSec +"초";
      this.crawlProgress = (crawled / total)*100;
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

  }
}

</script>
