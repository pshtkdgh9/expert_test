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
// 		"id": "과제고유번호",
// 		"koTitle": "국문과제명",
// 		"enTitle": "영문과제명",
// 		"mng": "연구책임자명",
// 		"mngId": "연구책임자 ID",
// 		"rsc": "참여인력",
// 		"rscId": "참여인력 ID",
// 		"cntRscMan": "참여인력수(남자)",
// 		"cntRscWom": "참여인력수(여자)",
// 		"goalAbs": "연구목표요약",
// 		"absAbs": "연구내용요약",
// 		"effAbs": "기대효과요약",
// 		"koKeyword": "한글키워드",
// 		"enKeyword": "영문키워드",
// 		"odAgency": "과제관리기관명",
// 		"ldAgency": "주관연구기관명",
// 		"prdStart": "총연구기간시작일",
// 		"prdEnd": "총연구기간종료일",
// 		"mscL": "내역사업명(대분류)",
// 		"mscM": "내역사업명(중분류)",
// 		"mscS": "내역사업명(소분류)",
// 		"perfAgent": "연구수행주체",
// 		"region": "지역구분",
// 		"totalFund": "연구비합계"
// }, {
// 		"id": "관리번호",
// 		"title": "논문명",
// 		"english_title": "영문 논문명",
// 		"author": "저자명",
// 		"journal": "저널_프로시딩명",
// 		"issue_inst": "발행기관",
// 		"issue_year": "발행년도",
// 		"issue_lang": "발행언어",
// 		"start_page": "시작페이지",
// 		"end_page": "끝페이지",
// 		"paper_keyword": "키워드",
// 		"abstract": "국문요약",
// 		"english_abstract": "영문요약",
// 		"author_inst": "저자 소속",
// 		"dreg_name": "KCI/SCI 구분"
// }, {
// 		"rank": "저자랭킹",
// 		"A_ID": "저자아이디",
// 		"name": "저자명",
// 		"inst": "저자소속",
// 		// "keyId": "검색아이디",
// 		"Recentness": "최신성",
// 		"Quality": "품질",
// 		"Productivity": "생산성",
// 		"Acc": "정확성",
// 		"Coop": "협업도",
// 		"Contrib": "기여도",
// 		"Durability": "연구지속성",
// 		"EScore": "전문가지수"
// },
// 	{
// 		"rank": "저자랭킹",
// 		"name": "전문가명",
// 		"inst": "저자소속",
// 		"A_ID": "저자아이디",
// 		"id": "관리번호",
// 		"title": "논문명",
// 		"english_title": "영문 논문명",
// 		"author": "저자명",
// 		"journal": "저널_프로시딩명",
// 		"issue_inst": "발행기관",
// 		"issue_year": "발행년도",
// 		"issue_lang": "발행언어",
// 		"start_page": "시작페이지",
// 		"end_page": "끝페이지",
// 		"paper_keyword": "키워드",
// 		"abstract": "국문요약",
// 		"english_abstract": "영문요약",
// 		"author_inst": "저자 소속",
// 		"dreg_name": "KCI/SCI 구분"
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
