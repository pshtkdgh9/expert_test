<template lang="html">
  <v-container class="col-6">
    <v-row align="center" justify="center" >
      <v-col cols='12'>
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
            <v-btn color="primary" right @click="importFile('kci')">Upload</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row align="center" justify="center" >
      <v-col cols='12'>
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
            <v-btn color="primary" right @click="importFile('sci')">Upload</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container >
</template>


<script>


import XLSX from 'xlsx'

export default {
  data() {
    return {
      file : { sci : null, kci : null},
    }},
    created(){
      this.$store.commit("setIsMini", false);
    },
    methods: {
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
                rows.some((row, i) => {
                if(row['Full Journal Title'] == undefined || row['5-Year Impact Factor'] == undefined)
                {
                  console.log('error line : ', i);
                  flag = false;
                }
              });
              }
              else{
                rows.some((row, i) => {
                  if(row['발행기관'] == undefined || row['(자기인용제외) KCI IF (5년)'] == undefined)
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
    }
  }

  </script>
