import axios from 'axios';
import handleError from './handleError';
import {
	showSnack,
	setLoading
} from './store.js';


//
// export const colSize = [
// 	[
// 		{
// 			wch: 12
// 		},
// 		{
// 			wch: 50
// 		},
// 		{
// 			wch: 50
// 		},
// 		{
// 			wch: 12
// 		},
// 		{
// 			wch: 18
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 15
// 		},
// 		{
// 			wch: 15
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 60
// 		},
// 		{
// 			wch: 60
// 		},
// 		{
// 			wch: 15
// 		},
// 		{
// 			wch: 15
// 		},
// 		{
// 			wch: 18
// 		},
// 		{
// 			wch: 18
// 		},
// 		{
// 			wch: 25
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 20
// 		},
// 		{
// 			wch: 30
// 		},
// 		{
// 			wch: 40
// 		},
// 		{
// 			wch: 20
// 		},
// 	],
//   [{
// 			wch: 15
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 20
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 15
// 	},
// ],
// 	[{
// 			wch: 15
// 	},
// 		{
// 			wch: 20
// 	},
// 		{
// 			wch: 20
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 20
// 	}, ],
//
// 	[{
// 			wch: 15
// 	},
// 		{
// 			wch: 20
// 	},
// 		{
// 			wch: 20
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 50
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 30
// 	},
// 		{
// 			wch: 25
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// 	},
// 		{
// 			wch: 15
// },
// 		{
// 			wch: 15
// },
// 		{
// 			wch: 15
// },
// 		{
// 			wch: 60
// },
// 		{
// 			wch: 60
// },
// 		{
// 			wch: 15
// }, ]
// ];
//
//
// export const fields = [{
// 		"id": "??????????????????",
// 		"koTitle": "???????????????",
// 		"enTitle": "???????????????",
// 		"mng": "??????????????????",
// 		"mngId": "??????????????? ID",
// 		"rsc": "????????????",
// 		"rscId": "???????????? ID",
// 		"cntRscMan": "???????????????(??????)",
// 		"cntRscWom": "???????????????(??????)",
// 		"goalAbs": "??????????????????",
// 		"absAbs": "??????????????????",
// 		"effAbs": "??????????????????",
// 		"koKeyword": "???????????????",
// 		"enKeyword": "???????????????",
// 		"odAgency": "?????????????????????",
// 		"ldAgency": "?????????????????????",
// 		"prdStart": "????????????????????????",
// 		"prdEnd": "????????????????????????",
// 		"mscL": "???????????????(?????????)",
// 		"mscM": "???????????????(?????????)",
// 		"mscS": "???????????????(?????????)",
// 		"perfAgent": "??????????????????",
// 		"region": "????????????",
// 		"totalFund": "???????????????"
// }, {
// 		"id": "????????????",
// 		"title": "?????????",
// 		"english_title": "?????? ?????????",
// 		"author": "?????????",
// 		"journal": "??????_???????????????",
// 		"issue_inst": "????????????",
// 		"issue_year": "????????????",
// 		"issue_lang": "????????????",
// 		"start_page": "???????????????",
// 		"end_page": "????????????",
// 		"paper_keyword": "?????????",
// 		"abstract": "????????????",
// 		"english_abstract": "????????????",
// 		"author_inst": "?????? ??????",
// 		"dreg_name": "KCI/SCI ??????"
// }, {
// 		"rank": "????????????",
// 		"A_ID": "???????????????",
// 		"name": "?????????",
// 		"inst": "????????????",
// 		// "keyId": "???????????????",
// 		"Recentness": "?????????",
// 		"Quality": "??????",
// 		"Productivity": "?????????",
// 		"Acc": "?????????",
// 		"Coop": "?????????",
// 		"Contrib": "?????????",
// 		"Durability": "???????????????",
// 		"EScore": "???????????????"
// },
// 	{
// 		"rank": "????????????",
// 		"name": "????????????",
// 		"inst": "????????????",
// 		"A_ID": "???????????????",
// 		"id": "????????????",
// 		"title": "?????????",
// 		"english_title": "?????? ?????????",
// 		"author": "?????????",
// 		"journal": "??????_???????????????",
// 		"issue_inst": "????????????",
// 		"issue_year": "????????????",
// 		"issue_lang": "????????????",
// 		"start_page": "???????????????",
// 		"end_page": "????????????",
// 		"paper_keyword": "?????????",
// 		"abstract": "????????????",
// 		"english_abstract": "????????????",
// 		"author_inst": "?????? ??????",
// 		"dreg_name": "KCI/SCI ??????"
// }
// ];



axios.defaults.baseURL = "http://203.255.92.141:8081/"


export const get = (context, url, data) => {
	setLoading(context, true)
	return new Promise((resolve, reject) => {
		axios.get(url, {
				params: data
			})
			.then(response => {
				showSnack(context, response);
				resolve(response);
			})
			.catch(error => {
				showSnack(context, null, error.message)
				reject(handleError(error))
			})
			.then(setLoading(context, false));
	})
}


export const post = (context, url, data) => {
	setLoading(context, true)
	return new Promise((resolve, reject) => {
		axios.post(url, {
				data
			})
			.then(response => {
				showSnack(context, response);
				resolve(response);
			})
			.catch(error => {
				showSnack(context, null, error.message)
				reject(handleError(error))
			})
			.then(setLoading(context, false));
	})
}
