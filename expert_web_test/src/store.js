import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import {
	get,
	post
} from './apiUtils';

import XLSX from 'xlsx'
import {
	saveAs
} from 'file-saver';
Vue.use(Vuex)

// const initWeight = new Array(6).fill(50)
const sheetNames = ['Projects', 'Papers', 'Experts'];

//DownloadJsonData(response.data, data.name + "_" + data.site, true, flag);
function DownloadJsonData(JSONData, FileTitle, ShowLabel, Flag) {
	// console.log('JSONDATA', JSONData);


	//If JSONData is not an object then JSON.parse will parse the JSON string in an Object


	var wb = XLSX.utils.book_new();
	// console.log('WB', wb);

	function s2ab(s) {
		var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
		var view = new Uint8Array(buf); //create uint8array as viewer
		for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
		return buf;
	}
	let outData = [];


	function isLooopable(w) {
		var arrayConstructor = [].constructor;
		var objectConstructor = ({}).constructor;
		if (w !== null) {
			if (w.constructor === arrayConstructor) {
				return true;
			}
			if (w.constructor === objectConstructor) {
				return true;
			}
		}
		return false
	}


	// let fieldItems = Object.keys(fields[Flag]);
	for (let i = 0; i < JSONData.length; i++) {
		let temp = {};
		// let j = 0;
		for (let field in JSONData[i]) {
			let fData = JSONData[i][field];
			if (isLooopable(fData)) {
				let temp = ""
				for (let inData in fData)
					temp += inData + " : " + fData[inData];
				fData = temp;
			}
			// if (field == 'name' || field == 'inst')
			// 	fData = fData.replace(/,/g, ";");
			if (fData === undefined || fData == 'null' || fData == "\"None\"" || fData == null)
				fData = '-';
			temp[field] = fData;
			// row += fData + ',';
		}
		outData.push(temp);
	}
	var newWorksheet = XLSX.utils.json_to_sheet(outData);
	XLSX.utils.book_append_sheet(wb, newWorksheet, sheetNames[Flag]);
	//
	// const worksheet = XLSX.utils.aoa_to_sheet(arrayOfArray);
	newWorksheet['!cols'] = fitToColumn(outData);

	function fitToColumn(outData) {
		// console.log('OUTDATA', outData);
		// get maximum character of each column
		let colSize = []
		for (let field in outData[0]) {
			// outData[0][field]
			// console.log('OUTDATA[0][FIELD]', outData[0][field]);
			let wch = outData[0][field].length;
			if (wch == 0 || wch === undefined)
				wch = 20;
			if (wch > 100)
				wch = 100;

			colSize.push({
				'wch': wch
			})
		}
		return colSize

	}


	var wbout = XLSX.write(wb, {
		bookType: 'xlsx',
		type: 'binary'
	});
	saveAs(new Blob([s2ab(wbout)], {
		type: "application/octet-stream"
	}), FileTitle + '.xlsx');


	// let arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
	// let CSV = '';
	// if (ShowLabel) {
	// 	let row = "";
	//
	// 	let fieldItems = Object.keys(fields[Flag]);
	// 	fieldItems.forEach((field) => {
	// 		row += fields[Flag][field] + ',';
	// 	});
	// 	row = row.slice(0, -1);
	// 	CSV += row + '\r\n';
	// }
	// for (var i = 0; i < arrData.length; i++) {
	// 	let row = "";
	// 	for (let field in fields[Flag]) {
	// 		let fData = arrData[i][field];
	// 		if (field == 'name' || field == 'inst')
	// 			fData = fData.replace(/,/g, ";");
	// 		if (fData === undefined || fData == 'null' || fData == "\"None\"")
	// 			fData = '-';
	// 		row += fData + ',';
	// 	}
	// 	row.slice(0, row.length - 1);
	// 	CSV += row + '\r\n';
	// }
	// if (CSV == '') {
	// 	alert("Invalid data");
	// 	return;
	// }
	// var filename = FileTitle;
	// var blob = new Blob(["\ufeff" + CSV], {
	// 	type: 'text/csv;charset=utf-8;'
	// });
	// if (navigator.msSaveBlob) { // IE 10+
	// 	navigator.msSaveBlob(blob, filename);
	// } else {
	// 	var link = document.createElement("a");
	// 	if (link.download !== undefined) { // feature detection
	// 		var url = URL.createObjectURL(blob);
	// 		link.setAttribute("href", url);
	// 		link.style = "visibility:hidden";
	// 		link.download = filename + ".csv";
	// 		document.body.appendChild(link);
	// 		link.click();
	// 		document.body.removeChild(link);
	// 	}
	// }
}

const msg = {
	timeout: 3000, //3s
	ok: "정상적인 응답입니다.",
	// history_ok: "검색 목록을 정상적으로 불러왔습니다.",
	fail: "비정상적인 응답입니다.",
	run: "벤치마킹이 시작되었습니다."
}

//snackbar
export const showSnack = (ctxt, rep, msgp = "") => {
	if (msgp === "") {
		// if (rep.status == 200 || rep.status == 204)
		// 	ctxt.commit('showSnack', msg.ok)
		// else if (rep.status == 404)
		// 	ctxt.commit('showSnack', msg.fail)
	} else {
		ctxt.commit('showSnack', msgp)
	}
}


//loading bar
export const setLoading = (ctxt, isLoading) => {
	ctxt.commit('setIsLoading', isLoading)
}



export const store = new Vuex.Store({
	plugins: [
    createPersistedState({
      storage: window.sessionStorage // store를 session storage 에 유지
    })
  ],
	// --------------------------------state -------------------------------------------------------------------------------------------------
	state: {
		isLoading: false,
		snack: {
			isShow: false,
			msg: ""
		},
		isMini: false,
		histories: [],
		activeTab: null,
		activeInnerTab: {},
		tabs: [],
		sites: {},
		integrations: {"Domestic" :[],"International":[]},
		igID: -1,
		igKeyword: "",
		filters: {
			"project": {},
			"paper": {}
		},
		igTotal: 0,
		igDomestic:0,
		igInternational:0,
		igRaw: {},
		prevfId: 0,
		rankinst : [],
		a_url : [],
		// selected: {
		// 		'inst': [],
		// 		'rsc': [],
		// 		'fund': [],
		// 		'year': []
		// 	},
		// 	'paper': {
		// 		'inst': [],
		// 		'year': [],
		// 		'journal': [],
		// 		'lang': []
		// 	},
		// }

	},
	// --------------------------------/state -------------------------------------------------------------------------------------------------



	// --------------------------------mutations -------------------------------------------------------------------------------------------------
	mutations: {

		setIsMini: (state, flag) => {
			state.isMini = flag;
		},
		closeTab: (state, id) => {
			state.tabs.splice(state.tabs.findIndex(x => x._id == id), 1);
			//state.activeInnerTab[dHistory._id] = 0;
			if (state.tabs.length > 0)
				state.activeTab = state.tabs[0]._id
			// if(idx != state.tabs.length){
			// 		state.tabs.
			// }
			//
			// if (state.activeTab == idx)
			// 	state.activeTab = state.tabs.length;
		},
		//snackbar
		closeSnack: (state) => {
			state.snack.isShow = false
		},
		showSnack: (state, message) => {
			state.snack = {
				isShow: true,
				// color: "cyan darken-2",
				msg: message,
				timeout: msg.timeout
			}


			// if (typeof message === 'object') {
			// 	let {
			// 		msg,
			// 		color
			//
			// 	} = message;
			// 	state.snack = {
			// 		isShow: true,
			// 		msg,
			// 		color,
			// 		timeout: msg.timeout
			// 	};7
			// } else {
			// 	state.snack = {
			// 		isShow: true,
			// 		color: "cyan darken-2",
			// 		msg: message,
			// 		timeout: msg.timeout
			// 	}
			// }
		},
		showalarm : (state, message) => {
			state.snack = {
				isShow: true,
				// color: "cyan darken-2",
				msg: message,
				timeout: msg.timeout
			}
		},

		setIsLoading: (state, payload) => {
			state.isLoading = payload
		},
		setHistories: (state, histories) => {
			if (histories.length > 0) {
				histories.forEach(item => {
					// console.log(item);
					item.sites.forEach(site => {
						// console.log(site);
						site._id = item._id;
					});
				});
				state.histories = histories;
			}
			// state.histories.forEach((item) => {
			// 	let total = 0
			// 	item.sites.forEach((site, i) => {
			// 		item[site] = Math.random() * 100
			// 		if (i != 0) {
			// 			total += item[site]
			// 		}
			// 	});
			// 	item['ALL'] = total / (item.sites.length - 1);
			// });

		},
		addHistory: (state, history) => {

			state.histories.unshift(history);
		},

		addDetailHistory: (state, dHistory) => {
			let idx = state.histories.findIndex(h => h._id === dHistory._id);
			Vue.set(state.histories, idx, dHistory);

			state.tabs.push(dHistory);
			// state.activeTab = dHistory._id;
			state.activeTab = state.tabs.length - 1;
			state.activeInnerTab[state.tabs.length - 1] = 0;


		},
		addExperts: (state, experts) => {
			experts.data.forEach((expert) => {
				expert.keyId = experts._id
			});

			let idx = state.tabs.findIndex(x => x._id == experts._id)

			state.tabs[idx].sites[experts._idx].lists = experts.data;
		},
		addExpertRelation: (state, rel) => {
			let site = state.tab.sites[rel._idx];
			if (rel.flag) {
				// this.
				site.nodes = [];
				site.links = [];
			}
			site.nodes = site.nodes.concat(rel.data.asResults);
			rel.data.results.forEach((item) => {
				site.links.push({
					"sid": item.sourceAId,
					"tid": item.targetAId,
					"name": item.count,
					_svgAttrs: {
						"stroke-width": item.count / 2
					}
				})
			});
		},
		setSites: (state, sites) => {
			state.sites = sites;
		},
		setFilters: (state, filters) => {
			delete filters['_id'];
			delete filters['keyId'];
			delete filters['fId'];
			if (Object.keys(filters).length > 0) {


				Object.keys(filters).forEach((filterKey) => {
					Object.keys(filters[filterKey]).forEach(ff => {

						if (filters[filterKey][ff].selected === undefined)
							filters[filterKey][ff].selected = [];
					});
					if (filters[filterKey].inst !== undefined) {
						filters[filterKey].inst.list = Object.keys(filters[filterKey].inst.list).slice(0, 10).reduce((result, key) => {
							// key = key.replaceAll('^', ".");

							result[key.replaceAll('^', ".")] = filters[filterKey].inst.list[key];
							return result;
						}, {});
						// filters[filterKey].inst.forEach((item) => {
						// 	item = item
						// });

					}
					if (filters[filterKey].journal !== undefined) {

						filters[filterKey].journal.list = Object.keys(filters[filterKey].journal.list).slice(0, 10).reduce((result, key) => {
							// key = key.replaceAll('^', ".");
							result[key.replaceAll('^', ".")] = filters[filterKey].journal.list[key];
							return result;
						}, {});
					}
					if (filters[filterKey].year !== undefined) {

						let temp = new Map();

						Object.keys(filters[filterKey].year.list).reverse().forEach((x) => {
							temp.set(x, filters[filterKey].year.list[x]);
						});
						// let ttemp = {};

						console.log('TEMP', temp);
						//
						// rtv.project[f].list = temp;
						filters[filterKey].year.list = temp;
					}

				});
			}
			state.filters = filters;
			console.log('FILTERS', filters);
			console.log('Filters completed')
		},
		setIntegrationResult: (state, igResult) => {

			igResult.result.forEach((author)=>{
			//	d_or_i.forEach((author) => {
					author.numPapers += "건";
					author.rKeywords = '-';
					author.network = '-';
					author.webSearch = 'https://www.google.com/search?q=' + author.name + "+" + author.inst;
					author.numProjects += "건";
					author.totalCitation += "회";
					author.totalCoop += "건";
					if (author.recentYear == '0') {
						author.recentYear = '-';
					} else {
						author.recentYear += "년";
					}
			//	});

		});

		//	var igs = {'Domestic':[], 'International':[]}
    //   for (let data = 0; data< igResult.result.length; data++) {
    //     //console.log("site:",this.selected[site].site)
    //     if (igResult.result[data].Country == "Domestic"){
    //       igs.Domestic.push(igResult.result[data])
    //       }
    //     else{
    //       igs.International.push(igResult.result[data])
		//
    //     }
    // }
		if(igResult.flag == 0)
		state.integrations.Domestic = igResult.result;

		else {
		state.integrations.International = igResult.result;
		}

			//state.integrations = igs;
			// state.integrations = igResult.result;
			console.log('STATE.INTEGRATIONS ', state.integrations);



		},


		setIntegrationRaw: (state, igRaw) => {
			state.igRaw[igRaw.idx] = igRaw;
			// state.integrations.forEach((item) => {
			// 	if (item.idx == igRaw.idx) {
			// 		item.raws = igRaw;
			// 		console.log('ITEM.RAWS ', item.raws);
			// 		return;
			// 	}
			// });


		},
		deleteSelected: (state) => {
			state.selected = {
				'project': {
					'inst': [],
					'rsc': [],
					'fund': [],
					'year': []
				},
				'paper': {
					'inst': [],
					'year': [],
					'journal': [],
					'lang': []
				},
			}
		},
		setSelected: (state, sel) => {

			Object.keys(sel.selected['paper']).forEach((key) => {


				if (sel.filters['paper'][key] !== undefined) {
					sel.selected['paper'][key] = sel.selected['paper'][key].map((filterItem) => {
						let rtv = -1;

						Object.keys(sel.filters['paper'][key].list).forEach((item, idx) => {
							if (item == filterItem) {
								rtv = idx;
								return;
							}
						});
						return rtv;
					});

					sel.selected['paper'][key] = sel.selected['paper'][key].filter(x => x >= 0);
				} else {
					sel.selected['paper'][key] = [];
				}
			});

			Object.keys(sel.selected['project']).forEach((key) => {

				if (sel.filters['project'][key] !== undefined) {
					if (key != 'rsc' && key != 'fund') {
						sel.selected['project'][key] = sel.selected['project'][key].map((filterItem) => {
							let rtv = -1;
							Object.keys(sel.filters['project'][key].list).forEach((item, idx) => {
								if (item == filterItem) {
									rtv = idx;
									return;
								}
							});
							return rtv;
						});
						sel.selected['project'][key] = sel.selected['project'][key].filter(x => x >= 0);
					}

				} else {
					sel.selected['project'][key] = [];
				}
			});
			state.selected = sel.selected;
		},
		setRank: (state, rank) => {
			state.rankinst = rank.Insts;
		},
		setNtis: (state, author_list) =>{
			state.a_url  = author_list;
		}
	},


	actions: {

		uploadIFFile: (context, data) => {
			post(context, 'uploadIFFile', data).then(response => {
				context.commit('showSnack', response.data + " 개가 입력되었습니다.")
			});
		},
		downloadExperts: (context, data) => {
			data.itemsPerPage = -2;
			return get(context, 'getExperts', data).then(response => {
				DownloadJsonData(response.data, data._site + "_" + data._id, true, 2);
			})
		},

		getExpertPapers: (context, data) => {
			// console.log('DATA', data);
			// let dd = {
			// 	cols: [{
			// 		name: "A",
			// 		key: 0
			// 	}, {
			// 		name: "B",
			// 		key: 1
			// 	}, {
			// 		name: "C",
			// 		key: 2
			// 	}],
			// 	data: [
			// 	["id", "name", "value"],
			// 	[1, "sheetjs", 7262],
			// 	[2, "js-xlsx", 6969]
			// ]
			// };
			// var worksheet = XLSX.utils.aoa_to_sheet(dd.data);
			// var new_workbook = XLSX.utils.book_new();
			// XLSX.utils.book_append_sheet(new_workbook, worksheet, "SheetJS");
			// const wbout = XLSX.write(new_workbook, {
			// 	type: "base64",
			// 	bookType: "xlsx"
			// });
			// const body = wbout;
			// stream.fetch({
			// 	method: 'GET',
			// 	type: 'json',
			// 	url: "http://203.255.92.48:8082/getExpertPapers",
			// 	body: body
			// }, function(res) {
			// 	//modal.toast({ message: 'KEY: ' + res.data.key, duration: 10 });
			//
			// 	// self.version = res.data.key
			// });


			return get(context, 'getExpertPapers', data).then(response => {
				let flag = data.site === 'NTIS' ? 0 : 1;
				if (data.flag === undefined)
					DownloadJsonData(response.data, data.name + "_" + data.site, true, flag);
				else
					DownloadJsonData(response.data, data.site + "_" + data.keyId + "_total", true, 3);



				// dd.data
				// 	const workbook = new Excel.Workbook();
				// 	const worksheet = workbook.addWorksheet('My Sheet');
				// 	worksheet.columns = [
				// 		{
				// 			header: 'ProjectNumber',
				// 			key: 'id',
				// 			width: 10
				// 		},
				// ];
				// 	response.data.forEach((item) => {
				// 		worksheet.addRow(item);
				// 	});
				// 	var tempFilePath = tempfile('.xlsx');
				//  workbook.xlsx.writeFile(tempFilePath).then(function() {
				// 		 res.sendFile(tempFilePath, function(err){
				// 		 });
				//  });
				//
				// 	// worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
				// 	// worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});
				// 	workbook.commit();
				// 	workbook.xlsx.writeFile('./temp.xlsx').then(function() {
				// 		// done
				// 	});

			});
		},
		getExpertRelation: (context, data) => {
			// const {
			// 	_idx,
			// 	flag
			// } = data;
			return get(context, 'getExpertRelation', data);
			// .then(response => {
			// 	context.commit('addExpertRelation', {
			// 		data: response.data,
			// 		_idx,
			// 		flag
			// 	})
			// })
		},
		sendCrawlRequest: (context, data) => {
			return get(context, 'sendCrawlRequest', data);


		},
		getExperts: (context, data) => {
			// console.log('DATA', data);
			// if (data.dFlag !== undefined) {
			// 	data.itemsPerPage = -1;
			// }
			// get(context, 'getExperts', data)
			return get(context, 'getExperts', data).then(response => {
				// if (data._idx != 0) {
				if (data.dFlag !== undefined) {
					// response
					// console.log('RESPONSE', response);
					return response.data;
				} else {
					context.commit('addExperts', {
						data: response.data,
						_id: data._id,
						_idx: data['_idx']
					})
				}
				// } else {
				// console.log(response.data);
				// }
			});

		},
		getDetailHistory: (context, id) => {

			get(context, 'getDetailHistory', id)
				.then(response => {
					console.log(response.data)
					context.commit('addDetailHistory', response.data);

				})
		},
		requestSearch: (context, data) => {

			post(context, 'requestSearch', data)
				.then(response => {
					let {
						flag,
						results
					} = response.data;
					if (flag)
						context.commit('addHistory', results);
					else {
						// closeSnack(context);
						context.commit('showSnack', "KeyId : " + results + " Now Crawling!");
					}
				})
		},
		//getHistories
		getHistories: (context, flag) => {
			//test id = 1



			if (flag === undefined && context.state.histories.length != 0) {

				return;
			}

			get(context, 'getHistories')
				.then(response => {
					// console.log('RESPONSE', response);
					// if(response.data)


					context.commit('setHistories', response.data);

				})

			// get(context, 'getHistories', {
			// 		id: 1
			// 	})
			// 	.then(response => {
			// 		context.commit('setHistories', response.data)
			// 	})
		},

		getSiteStatus: context => {
			return get(context, 'getSiteStatus').then(response => {
				context.commit('setSites', response.data);
			})
		},
		getTest: context => {
			showSnack(msg.remove, context)
		},
		removeHistory: (context, data) => {
			return get(context, 'removeHistory', data);
		},
		editHistory: (context, data) => {
			return get(context, 'editHistory', data);
		},
		getIntegrationData: (context, data) => {
			console.log('DATA', data);

			context.state.igID = data.id;
			context.state.igKeyword = data.query_keyword;
			context.commit('setFilters', {});
			// return post(context, 'getIntegrationData', data).then(response => {
			// 	// response.data
			// 	console.log('RESPONSE.DATA', response.data);
			// 	context.commit('setFilters', response.data);
			// });
		},
		getIntegrationResult: (context, data) => {
			console.log('CONTEXT, DATA', context, data);

			let size = 0;
			data.fId = -1;
			data.filter = context.state.filters;
			// data.project = context.state.selected.project;
			// data.paper = context.state.selected.paper;
			// // let data = {};

			// let data = Object.assign({}, _data);
			// Object.assign
			Object.keys(data.filter).forEach((key) => {
				Object.keys(data.filter[key]).forEach((ff) => {
					// console.log('FILTER', filter);
					// console.log('KEY', key);
					// context.state.filters[key][filter]
					// // console.log('CONTEXT.STATE.FILTERS[KEY][FILTER]', context.state.filters[key][filter]);
					if (ff == 'year') {
						data.filter[key][ff].selected = data.filter[key][ff].selected.map((item) => {
							console.log('ITEM', item);
							// 	// console.log();
							//
							//
							// 	// context.state.filters[key][filter]['list']
							// 	// console.log('CONTEXT.STATE.FILTERS[KEY][FILTER][\'LIST\']', );
							// 	// console.log('CONTEXT.STATE.FILTERS[KEY][FILTER].LIST[ITEM]', context.state.filters[key][filter]['list'][item]);
							console.log('DATA.FILTER[KEY][FF].LIST[ITEM]', data.filter[key][ff].list);
							return Array.from(data.filter[key][ff].list)[item][0];
							// context.state.filters[key][filter]['list']
						});
						console.log('TTTTTTTTTTTTTTTT', data.filter[key][ff].selected);

					}

					// console.log('DATA[KEY][FILTER]', data[key][filter]);
					size += data.filter[key][ff].selected.length;
				});
			});
			// data
			console.log('DATA', data);
			// console.log('DATA', _data);
			console.log('SIZE', size);
			if (size == 0) {
				// if (context.state.prevfId != 0) {
				// data.fId = context.state.prevfId;
				// } else {
				data.fId = 0;
				// }
			}

			data.prevfId = context.state.prevfId;
			// return;

			context.state.histories.forEach((item) => {
				if (item._id == data.keyId) {
					data.sites = item.sites;
					return;
				}
			});


			// //data.fId = 1;
			return post(context, 'getIntegrationResult', data).then(response => {
				// response.data
				console.log('RESPONSE.DATA', response.data);
				let temp = {};
				temp.result =  response.data.Domestic_res;
				temp.flag = 0;
				context.commit('setIntegrationResult', temp);
				temp.result =  response.data.International_res;
				temp.flag = 1;
				context.commit('setIntegrationResult', temp);

				context.state.igTotal = response.data.totalExperts;
				context.state.igDomestic = response.data.DomesticExperts;
				context.state.igInternational = response.data.InternationalExperts;
				if (response.data.prevfId != 0)
					context.state.prevfId = response.data.prevfId;
				context.commit('setFilters', response.data.filters);

				// .then(context.commit('setSelected', response.data));

				return response.data;
			});

		},
		getIntegrationRaw: (context, data) => {

			return post(context, 'getIntegrationRaw', data).then(response => {
				// response.data
				console.log('RESPONSE.DATA', response.data);
				response.data.idx = data.idx;
				// return response.data;
				context.commit('setIntegrationRaw', response.data);
			});

		},
		deleteIntegration: (context, keyId) => {
			get(context, 'deleteIntegration', {
				"keyId": keyId
			});
		},
		getReloadPage: (context, data) => {

			return post(context, 'getReloadPage', data).then(response => {
				// response.data
				response.data.flag = data.flag;
				console.log('RESPONSE.DATA', response.data);
				context.commit('setIntegrationResult', response.data);
				//	context.commit('setIntegrationRaw', response.data);
			});

		},
		getInstRank: (context, data) =>{
			//console.log("string");
			return get(context, 'getInstRank', data).then(response =>{
				context.commit('setRank', response.data);
				console.log("setRank",response.data);
			}) ;
		},
		getNtisAPI: (context, data) =>{
			return get(context, 'getNtisAPI', data).then(response =>{
				context.commit('setNtis', response.data);
				console.log('setNtis',response.data)
			})
		},
		getstopPage: (context, data) => {
			console.log("stopPage",data)
			get(context, 'getstopPage', data);

			// return post(context, 'getIntegrationData', data).then(response => {
			// 	// response.data
			// 	console.log('RESPONSE.DATA', response.data);
			// 	context.commit('setFilters', response.data);
			// });
		},

		}

	});
