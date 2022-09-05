const fs = require("fs");
const path = require('path');
const Moment = require('moment-timezone');
const settings = require('./settings');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const util = require('util');
const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const xl = require('excel4node');
const Timsort = require('timsort');
//const XLSX = require('xlsx');
/*for Logger*/
const winstonDaily = require('winston-daily-rotate-file');

const timeStampFormat = () => {
	return Moment().format('YYYY-MM-DD HH:mm:ss.SSS zz');
}
const mode = settings.mode

const DEBUG = (msg) => {
	console.log('MSG', msg);
}

const sites = ['NTIS', 'SCIENCEON', 'DBPIA', 'SCOPUS', 'KCI', 'WOS'];


/*
@ cmds 						: Producer / DBPIA 소속 수집기 파일 위치 및 실행 명령어
@ producerPrgm		: producer 파일 위치 지정
@ crawlerPrgm			: DBPIA 소속 수집기 파일 위치 지정
*/
let cmdPath = "python3 -u /home/search/apps/product"
let cmds = {

	'producerPrgm': cmdPath + '/producer/producer.py ',
	'crawlerPrgm': cmdPath + '/etc/DBPIA_CRAWLER.py',
	'getStatusPrgm': 'pgrep -f DBPIA_CRAWLER | wc -l',
	'killPrgm': 'kill -9 \`pgrep -f DBPIA_CRAWLER\`',
	'intergrationPrgm': cmdPath + '/combine/Filtering.py '
};


// DB 변수 목록
let dbs = {};
const qk_col = 'QueryKeyword';
const a_col = 'Author';
const ar_col = a_col + 'Relation';
const ef_col = 'ExpertFactor';
const eft_col = ef_col + 'Table';
const raw_col = 'Rawdata';
const ps_col = a_col + 'Papers';
const crawl_col = "DBPIA_CRAWLER";
const rank_col = "rank_inst";

const mul = "$multiply";
const reqFactor = ["Recentness", "Quality", "Productivity", "Acc", "Coop", "Contrib", "Durability"];
const selFactor = ["Durability"];

// 추천 최소 수 및 소수 점  변수 목록
const roundValue = 2;
const topk = 10;
const myKey = 4865;
// const totalExperts = 50;

Number.prototype.round = function(places) {
	return +(Math.round(this + "e+" + places) + "e-" + places);
}


//MongoDB DB 연결
MongoClient.connect(settings.mongoURL, {
	useUnifiedTopology: true
}, function(err, db) {
	if (err) throw err;

	sites.forEach((site) => {
		dbs[site] = db.db(site);
	});
	dbs['PUBLIC'] = db.db('PUBLIC');
	dbs['ID'] = db.db('ID');
});


let timeout
/*
@ checkErr	: Response Error 응답 생성
@ err				: err 여부 확인 용
@ res				: 응답 객체
*/
function checkErr(err, res) {
	if (err) {
		logger.error(err);
		if (typeof res !== 'undefined')
			res.status(404).end();
	}
}

/*
@ convertDate	: 시간 포맷 변환 함수
*/
function convertDate(d) {
	return Moment(d).format('YYYY-MM-DD HH:mm:ss');
}

/*
@ getExperts	: 전문가 목록 요청 API
@ req 				: 요청 객체 (_id, _site, _idx, page, itemsPerPage, total, flag)
	# _id		: 검색 id
	# _site	: 사이트 명
	# _idx	: 검색 id에서 내부적인 위치 인덱스 (ALL  검색인지 사이트별 검색인 지)
	# page	: 전문가 검색 요청 page (페이징 기법 적용 위함)
	# itemsPerPage : 페이지 당 보여질 item 수
	# total : 총 전문가 수 (page 계산 위함)
	# flag  : 내부 요청인지 웹페이지를 통한 요청인지 구분하기 위한 변수
@ res 				: 응답 객체
*/
async function getExperts(req, res) {
	DEBUG("GET Experts")
	let {
		_id,
		_site,
		_idx,
		page,
		itemsPerPage,
		total,
		flag
	} = req.query
	return new Promise(async (resolve, reject) => {
		if (_idx == 0) {


			let siteExperts = await Promise.all(req.query.sites.map(async site => {
				if (itemsPerPage == -1)
					itemsPerPage = 50;

				let result = await getResults(itemsPerPage, 1, req.query, site, _id, total);
				result.forEach((item, i) => {
					item.site = site;
				});
				return result;
			}));

			siteExperts = siteExperts.flatMap(x => x).sort((x, y) => y.EScore - x.EScore);
			siteExperts.forEach((x, idx) => x.rank = idx + 1);
			handleResponse(siteExperts, res);
		} else {
			getResults(itemsPerPage, page, req.query, _site, _id, total).then((result) => {
				if (flag === undefined)
					handleResponse(result, res);
				else {
					resolve(result);
				}
			});

		}
	});

	function getResults(_ipg, _page, _query, _site, _id, _total) {

		return new Promise((resolve, reject) => {
			if (_ipg == -1) {
				_ipg = totalExperts;
				_page = 1;
			}
			if (_ipg == -2) {
				_ipg = _total;
				_page = 1;
			}

			_page = parseInt(_page)
			_ipg = parseInt(_ipg)
			let otemp = {}
			let etemp = []
			reqFactor.forEach((x, idx) => otemp[x] = {
				'$multiply': [parseFloat(_query['' + idx]), '$' + x]
			})
			for (let i in otemp) etemp.push(otemp[i])
			otemp.EScore = {
				"$sum": etemp
			}
			otemp.Numpaper = '$Numpaper';
			otemp.A_ID = '$A_ID'
			dbs[_site].collection(ef_col).aggregate([
				{
					"$match": {
						"keyId": parseInt(_id)
					}
		},
				{
					"$project": otemp,
		},
				{
					"$sort": {
						"EScore": -1,
						"A_ID": -1
					}
		},
				{
					"$limit": ((_page - 1) * _ipg + _ipg)
		},
				{
					"$skip": (_page - 1) * _ipg
		}
	]).toArray(function(err, aggRes) {
				if (err) {
					handleError(err, res)
				} else {
					let authors = aggRes.map(a => a.A_ID)

					dbs[_site].collection(a_col).find({
						"_id": {
							"$in": authors
						}
					}).toArray(function(err, fResults) {
						if (err) {
							handleError(err, res);
							reject();

						} else {
							aggRes.forEach((item, i) => {
								item.rank = (_page - 1) * _ipg + (i + 1);
								let fIdx = fResults.findIndex(f => f._id === item.A_ID);
								reqFactor.forEach(factor => item[factor] = item[factor].round(roundValue));
								item.EScore = item.EScore.round(roundValue);

								if (fIdx != -1) {
									item.name = fResults[fIdx].name;
									item.inst = fResults[fIdx].inst;
								}

							});

							resolve(aggRes);
						}
					})
				}
			});
		});
	}

}


function getDetailHistory(req, res) {

	DEBUG("GET Detail History")
	let id = parseInt(req.query.id)

	dbs['PUBLIC'].collection(qk_col).findOne({
			"_id": id
		}, {},
		function(err, result) {
			if (err) handleError(err, res)

			if (result != null) {

				result['sites'] = [{
					'site': 'ALL',
					'progress': 0,
					'state': 5
				}]
				mongoAction(a = [result], [...sites], qk_col, "find", setProState, {
						"_id": id
					})
					.then((_result) => {
						console.log('_RESULT', _result[0].sites);
						setAllProState(_result);
						let _sites = _result[0].sites.map(x => x.site)
						let total = 0;
						_result[0].sites.forEach((s, idx) => {
							s.lists = [];
							total += s.experts;
						});
						_result[0].totalExpert = total;

						handleResponse(_result[0], res);

					})
			}

		})
}

function insertPub(_col, _data, _handler) {
	dbs['PUBLIC'].collection(_col).insertOne(_data, _handler);
}

//post
function requestSearch(req, res) {
	DEBUG("POST requestSearch")
	DEBUG(req.body.data)
	// return
	let {
		searches,
		sites,
		years
	} = req.body.data;

	let _sites = sites.map(x => x.site);
	let filters = sites.map(x => x.filter);

	function requestSearchHelper() {
		if (searches.length > 0 && _sites.length > 0) {
			let _keyword = searches.map(x => {
				if (x.type === 'OR')
					return "|" + x.word
				else if (x.type === 'NOT')
					return '!' + x.word
				else
					return x.word
			}).join(' ')
			console.log('_KEYWORD', _keyword);
			insertSearchKeywordPub(_keyword, res, _sites, years, filters);
		} else {
			res.statusCode = 404
			res.end()
		}
	}

	if (_sites.length > 0) {

		mongoAction([], [..._sites], qk_col, "find", function(_data, _result, _site) {
			if (_result.length > 0)
				_data.push(_result[0]._id)
		}, {
			"state": 0
		}).then((results) => {

			// console.log('RESULTS', results);

			if (results.length > 0) {

				dbs['PUBLIC'].collection(qk_col).findOne({
					"_id": results[0]
				}, (err, result) => {
					if (err) handleError(error, res);
					else {
						let now = moment().format('YYYY-MM-DD HH:mm:ss');
						if (result != null) {
							if (moment().diff(moment(result.query_time)) < 60 * 60 * 1000) {
								handleResponse({
									"flag": 0,
									"results": results[0]
								}, res);
								return;
							}
						}
						requestSearchHelper();
					}
				});

			} else {
				requestSearchHelper();
			}
		}).catch((error) => handleError(error, res));
	}



}

function getMaxID() {
	return new Promise((resolve, reject) => {

		var cur = dbs['PUBLIC'].collection(qk_col).find({}, {
			sort: {
				'_id': -1
			},
			limit: 1
		})
		cur.hasNext((err, result) => {
			// result
			if (err) reject(err)
			if (result) {
				cur.next().then(x => {
					resolve(x._id)
				})
			} else {
				resolve(0)
			}
		})
	})
}

function insertSearchKeywordPub(_keyword, res, _sites, _years, filters) {

	let now = moment().format('YYYY-MM-DD HH:mm:ss')

	getMaxID().then(_id => {
		insertPub(qk_col, {
				'_id': _id + 1,
				'query_time': now,
				'query_keyword': _keyword,
				'year': _years,
				'total': _sites.length,
				'completed': 0
			},
			function(err, insRes) {
				if (insRes.result.ok) {
					insRes.ops[0]['sites'] = [
						{
							'site': 'ALL',
							'state': 0,
							'progress': 0
					}
				]
					mongoAction(insRes.ops[0], [..._sites], qk_col, "insert", function(_data, _insRes, _site) {
							_data.sites.push({
								'site': _site,
								'progress': 0,
								'state': 0
							})
						}, {
							'_id': insRes.ops[0]._id,
							'progress': 0,
							'state': 0,
							'filter': [...filters]
						})
						.then((results) => {

							let year = moment().year() - _years;
							// console.log('YEAR', year);
							_keyword = _keyword.replace(/"/g, "\\\"")
              _keyword = _keyword.replace(/[|]/g, "\\|")
							_sites.forEach((site, i) => {
								console.log('SITE', site);

								try {
									setTimeout(() => {
										let filterString = 0;
										if (filters[i])
											filterString = 1

										let cmd = cmds.producerPrgm + _keyword + ' ' + results._id + ' ' + year + ' ' + site + ' ' + filterString;
										console.log('CMD', cmd);
										let cmdProcess = spawn(cmd, null, {
											shell: true
										});
										cmdProcess.stderr.on('data', function(data) {
											console.log('SITE ==> ', site);
											console.log('DATA', data.toString());
										});
										cmdProcess.stdout.on('data', function(data) {
											console.log('SITE ==> ', site);
											console.log('DATA', data.toString());
										});
									}, 1000);

								} catch (e) {
									console.log(site, ' Error', e);
								}

							});

							results.state = 0;

							handleResponse({
								"flag": 1,
								results
							}, res);
						})
						.catch((error) => {
							handleError(error, res);
						})
				} else {
					handleError(true, res)
				}
			})
	})
}

function handleError(err, res) {
	if (err) {
		console.log(err);
		res.statusCode = 404;
		res.end();
	}
}

function handleResponse(_response_data, res) {
	// DEBUG(_response_data);
	res.status(200).send(_response_data);
	res.end();
}

function mongoAction(_data, _sites, _col, _action, _getFunc = null, _f_data = {}, _options = {}) {
	return new Promise((resolve, reject) => {
		if (_sites.length > 0) {
			let site = _sites[0]
			// let idx = sites.indexOf(site)
			switch (_action) {
				case "find":
					dbs[site]
						.collection(_col)
						.find(_f_data, _options)
						.toArray(function(err, result) {
							if (err) reject(err);
							if (_getFunc != null) _getFunc(_data, result, site);
							_sites.splice(0, 1);
							return resolve(mongoAction(_data, _sites, _col, "find", _getFunc, _f_data, _options));
						})
					break;
				case "insert":
					let f_temp = Object.assign({}, _f_data);
					if (_f_data['filter'] !== undefined)
						f_temp['filter'] = _f_data['filter'][0];

					dbs[site]
						.collection(_col)
						.insertOne(f_temp,
							function(err, insRes) {
								if (err) reject(err)
								if (_getFunc != null) _getFunc(_data, insRes, site);
								_sites.splice(0, 1);
								if (_f_data['filter'] !== undefined)
									_f_data['filter'].splice(0, 1);
								return resolve(mongoAction(_data, _sites, _col, "insert", _getFunc, _f_data, _options));
							})
					break;
				case "count":
					dbs[site]
						.collection(_col)
						.countDocuments(_f_data, _options,
							function(err, result) {
								if (err) reject(err)
								if (_getFunc != null) _getFunc(_data, result, site);
								_sites.splice(0, 1);
								return resolve(mongoAction(_data, _sites, _col, "count", _getFunc, _f_data, _options));
							})
					break;
			}
		} else {
			return resolve(_data)
		}
	})
}

function getHistoriesALL(res) {

	dbs['PUBLIC']
		.collection(qk_col)
		.find({}, {
			sort: {
				'_id': -1
			}
		})
		.toArray(function(err, result) {
			handleError(err, res);
			result.forEach(x => {
				x['sites'] = [
					{
						'site': 'ALL',
						'progress': 0,
						'state': 5
				}
			];
			})

			mongoAction(
					result,
					[...sites],
					qk_col,
					"find",
					setProState)
				.then((_result) => {
					setAllProState(_result)
					handleResponse(_result, res);
				})
				.catch((error) => {
					handleError(error, res);
				})
		});

}

function setProState(_data, _result, _site) {
	_data.forEach(query => {
		let idx = _result.findIndex(r => r._id === query._id)
		if (idx != -1) {
			let crawl_time = '';
			let a_time = '';
			let sec = 1000;
			let min = sec * 60;
			let hr = min * 60;
			const makeTimeString = (t) => {
				let h = parseInt((t / hr));
				t -= h * hr;
				let m = parseInt((t / min));
				t -= m * min;
				let s = parseInt((t / sec));

				return h + "h " + m + "m " + s + "s";
			}
			// console.log('_RESULT[IDX].CRAWL_TIME', _result[idx].crawl_time);
			if (_result[idx].crawl_time != undefined) {
				// console.log('CONDITION PASSED');
				let temp = moment(query.query_time)
				let ctemp = moment(_result[idx].crawl_time);
				crawl_time = makeTimeString(ctemp.diff(temp));
				// crawl_time = (crawl_time / hr) +
				if (_result[idx].a_time != undefined) {
					a_time = makeTimeString(moment(_result[idx].a_time).diff(ctemp));
				}
			}
			query.sites.push({
				'site': _site,
				'progress': _result[idx].progress,
				'state': _result[idx].state,
				crawl_time,
				'data': _result[idx].data,
				a_time,
				'experts': _result[idx].experts,
				'isPartial': _result[idx].isPartial,
				'filter': _result[idx].filter

			})
		}
	})
}

function setAllProState(_data) {
	_data.forEach(query => {
		let all_state = query.sites.reduce(
			(prev, cur) => {
				return {
					state: prev.state > cur.state ? cur.state : prev.state
				}
			}, {
				state: 5
			})
		let all_pro = query.sites.reduce(
			(prev, cur) => {
				return {
					progress: parseFloat(prev.progress) + parseFloat(cur.progress)
				}
			}, {
				progress: 0
			})

		query.state = all_state.state;
		query.sites[0].state = all_state.state;
		query.sites[0].progress = all_pro.progress / (query.sites.length - 1);
		query.sites.forEach((site, i) => {
			// site
			// console.log('SITE', site);
			site.progress = parseFloat(site.progress).round(roundValue);
		});

		// console.log('ALL_PRO.PROGRESS ', all_pro.progress);
	})
}


function getHistories(req, res) {

	getHistoriesALL(res);
}

async function getExpertPapers(req, res) {
	DEBUG("GET ExpertPapers");
	let {
		A_ID,
		site,
		keyId,
		name,
		flag
		// query_keyword
	} = req.query;

	keyId = parseInt(keyId);
	// let idx = sites.indexOf(site);]

	const getAIDPapers = async (id) => {
		return new Promise((resolve, reject) => {
			dbs[site].collection(ps_col).findOne({
				"A_ID": id,
				"keyId": keyId
			}, (err, result) => {
				let papers = result.papers.map(x => {
					return new ObjectId(x)
				});

				dbs[site].collection(raw_col).find({
					"_id": {
						"$in": papers
					}
				}).toArray((err, result) => {
					// console.log('RESULT', result);
					if (err)
						reject(err);

					result.forEach((paper, i) => {
						for (let key in paper) {
							if (typeof paper[key] === "string") {
								//paper[key] = paper[key].replace(/,/g, ";");
							}
						}
					});
					resolve(result);

				});

			});
		});


	}

	// FIXME: all int or string check later
	// if (site == 'SCIENCEON')
	// A_ID = parseInt(A_ID);
	if (flag === undefined) {

		getAIDPapers(A_ID).then(result => handleResponse(result, res));

	} else {

		/*get Expert Papers (Top 50)*/
		dbs[site].collection(raw_col).find({
			"keyId": keyId
		}).toArray((err, result) => {
			// console.log('RESULT', result);
			if (err)
				handleError(err, res);

			result.forEach((paper, i) => {
				for (let key in paper) {
					if (typeof paper[key] === "string") {
						// paper[key] = paper[key].replace(/,/g, ";");
					}
				}
			});
			handleResponse(result, res);
		});
		/*
		req.query.itemsPerPage = -1;
		req.query._id = keyId;
		req.query._site = site;

		// console.log('REQ', req);

		getExperts(req, res).then(async experts => {

			let finResults = []
			await Promise.all(experts.map(async (_aid) => {
				let papers = await getAIDPapers(_aid.A_ID);
				// console.log('PAPERS', papers);
				papers.forEach((item, i) => {
					Object.assign(item, _aid);
					finResults.push(item);
				});
			}));

			finResults.sort((a, b) => {
				return a.rank - b.rank;
			});
			handleResponse(finResults, res);
		});
		*/


	}

}

//not used
function createSheet(papers, flag) {
	return new Promise(resolve => {
		let wb = new xl.Workbook();
		let ws = wb.addWorksheet('Papers');
		let idx = flag == 0 ? 0 : 1;
		let fieldItems = Object.keys(fields[idx]);
		fieldItems.forEach((field, i) => {
			ws.cell(1, i + 1).string(fields[idx][field]);
			console.log('FIELDS[IDX][FIELD]', fields[idx][field]);
		});

		resolve(wb);

	});
}

async function uploadIFFile(req, res) {
	DEBUG("POST uploadIFFile");
	// DEBUG(req.body.data);
	let {
		rows,
		type
	} = req.body.data;

	        if (type == 'kci') {
		rows = rows.map(x => {
 			return {
				name: x['학술지명'],
				IF: x['(자기인용제외) KCI IF (5년)'],
				ISSN:x['ISSN']
		}
});
	let utype = type.toUpperCase();
	let temp = rows.map(row => row.IF);
	let max_value = Math.max(...temp);
	let rows2 = rows.map(x=>{
		return {
			name :x['name'],
			IF: x['IF']/max_value,
      ISSN:x['ISSN']
		}
	});
        console.log(max_value)
        	dbs['PUBLIC'].collection(utype).deleteMany();
        		dbs['PUBLIC'].collection(utype).insertMany(rows2, function(err, result) {
        				if (err)
        							handleError(err, res);
        									else
        												handleResponse(String(result.insertedCount), res);
        													});
	} else {
		rows = rows.map(x => {
			if (x['5-Year Impact Factor'] == 'NA'){
				return {
					name: x['Full Journal Title'],
					IF: 0,
	        ISSN:x['ISSN']
				}
			}
			else{
			  return {
				 name: x['Full Journal Title'],
				 IF: 	x['5-Year Impact Factor'],
         ISSN:x['ISSN']
			}}}
		);
		let utype = type.toUpperCase();
		let max_value_dic = {};
		let cnt = 0;
		let rows_array = [];


		// 카테고리 별 최대값 구하기 max_value_dic
		for (let i = 0; i<rows.length; i++){

			let uname = rows[i]['name'].toUpperCase();
			let row_data = await dbs["PUBLIC"].collection("SCI_Categories").findOne({
				_id:uname
			});
			if(!row_data){
				row_data = {};
				row_data['_id'] = rows[i]['name'];
				row_data['ISSN'] = rows[i]['ISSN'];
				row_data['Categories'] = 'none';
				row_data['IF'] = parseFloat(rows[i]['IF']);
			} else{
				row_data['IF'] = parseFloat(rows[i]['IF']);
				row_data['Categories'] = row_data['Categories'].trim();

			}

			if((max_value_dic[row_data['Categories']]<row_data['IF'])||!max_value_dic[row_data['Categories']])
			{
				max_value_dic[row_data['Categories']] = row_data['IF'];

			}
			rows_array.push(row_data)
	}

		//IF 카테고리 별  정규화
		rows = await Promise.all(rows_array.map(async (x)=>{
			return {
				name : x['_id'],
				IF: x['IF']/max_value_dic[x['Categories']],
				ISSN: x['ISSN']
			}
		}));


//		console.log('max_value_dic',max_value_dic)
//		console.log('max_value_dic', Object.keys(max_value_dic).length)


		dbs['PUBLIC'].collection(utype).deleteMany();
		dbs['PUBLIC'].collection(utype).insertMany(rows, function(err, result) {
			if (err)
				handleError(err, res);
			else
				handleResponse(String(result.insertedCount), res);
			});
}
}

function sendCrawlRequest(req, res) {
	DEBUG("GET sendCrawlRequest");
	let {
		flag,
		isCrawl
	} = req.query;
	let status = isCrawl == 'true' ? 0 : 1;
	console.log('REQ.QUERY', req.query);
	const killCrawler = () => {
		exec(cmds['killPrgm']);
	}

	const getCrawlStatus = async (sFlag = 0) => {

		let doc = await dbs['PUBLIC'].collection(crawl_col).findOne({
			"_id": myKey
		})
		// console.log('DOC', doc);
		// console.log('SFLAG', sFlag);
		if (sFlag) {
			if (doc.status == 0 && sFlag == 2) {
				killCrawler();
			}
			if (doc.status == 1 && sFlag == 1) {
				// status = 1;
				runCrawler(1);
				return;
			}
			// doc.data.status = 1;

		}
		// console.log('DOC', doc);
		handleResponse(doc, res);
	}

	const runCrawler = (_status) => {
		dbs['PUBLIC'].collection(crawl_col).updateOne({
			"_id": myKey
		}, {
			'$set': {
				"status": _status
			}
		}, function(error, result) {
			if (error) {
				handleError(err, res);
				return;
			}
			// console.log('RESULT', result)
			if (result.result.ok == 1) {
				if (_status) {
					try {
						let cmdProcess = spawn(cmds['crawlerPrgm'], null, {
							shell: true
						});
						cmdProcess.stdout.on('data', function(data) {
							console.log('Crawler', data.toString());
						});

					} catch (e) {
						console.log('Error', e);
					}
				}
				getCrawlStatus();
			} else {
				handleError("Key not Matched", res);
			}
		});
	}


	switch (parseInt(flag)) {
		case 0:
			console.log('flag = 0')
			killCrawler();
			runCrawler(status);
			break;
		case 1: // only get?

			let cmdProcess = cmds['getStatusPrgm'];
			console.log(cmdProcess);
			let output = execSync(cmdProcess).toString();
			console.log('OUTPUT', output);
			getCrawlStatus(output);

			// cmdProcess.stdout.on('data', function(data) {
			// 	if(parseInt(data)){
			//
			// 	}
			// });
			// getCrawlStatus();
			break;
	}
}


function getExpertRelation(req, res) {
	DEBUG("GET ExpertRelations");
	let {
		A_ID,
		site,
		keyId
	} = req.query;
	console.log('REQ.QUERY', req.query);

	// if (site == 'SCIENCEON')
	// A_ID = (A_ID)


	const getRelations = () => {
		return new Promise((resolve, reject) => {
			dbs[site].collection(ar_col).find({
				"sourceAId": A_ID,
				"keyId": parseInt(keyId)
			}).toArray((err, results) => {
				// console.log('RESULTS', results);
				if (err) {
					handleError(err, res);
				} else {
					resolve(results);
				}
			})
		})
	}

	const getNames = (results) => {
		if (results.length == 1 && results[0].targetAId == '-777')
			results.splice(0, 1);
		let authors = [...new Set(results.map(x => x.targetAId))];
		authors.push(A_ID);
		dbs[site].collection(a_col).find({
			"_id": {
				"$in": authors
			}
		}).toArray((err, asResults) => {
			if (err) {
				handleError(err, res)
			} else {

				let otemp = {}
				let etemp = []
				reqFactor.forEach((x, idx) => otemp[x] = {
					'$multiply': [parseFloat(req.query['' + idx]), '$' + x]
				})
				// selFactor.forEach((x, idx) => otemp[x] = {
				// 	'$multiply': [parseFloat(temp[idx]), '$' + x]
				// })
				for (let i in otemp) etemp.push(otemp[i])
				otemp.EScore = {
					"$sum": etemp
				}
				otemp.A_ID = '$A_ID'
				dbs[site].collection(ef_col).aggregate([
					{
						"$match": {
							"keyId": parseInt(keyId),
							"A_ID": {
								"$in": authors
							}
						}
					},
					{
						"$project": otemp,
					}]).toArray(function(err, aggRes) {
					if (err) {
						handleError(err, res);
					} else {
						let score = {};
						aggRes.forEach(ar => {

							score[ar.A_ID] = ar.EScore;
						});

						asResults = asResults.map((item, i) => {
							return {
								"id": item._id,
								"name": item.name,
								"inst": item.inst,
								"Escore": score[item._id]
							}
						});

						handleResponse({
							results,
							asResults
						}, res);

					}
				})

			}
		});
	}




	function getRelationships(relationships, paper) {

		const getData = () => {
			return new Promise(async (resolve, reject) => {
				// let rtv = null;
				if (site == 'NTIS') {
					let rtv = []
					let rscIds = paper['rscId'];
					let mngId = paper['mngId'];
					// let mngName = paper['mng'].replace(/"/g, "");
					// let names = paper['rsc'].replace(/"./g, "").split(';');
					// let inst = paper['ldAgency'].replace(/"/g, "");
					if (rscIds != null)
						rtv = rscIds.split(';');
					// if (rscIds.length > names.length)
					// 	rscIds.splice(names.length);

					rtv.push(mngId);
					// names.push(mngName);

					// rscIds = await Promise.all(rscIds.map((rsc, idx) => {
					// 	let id = rsc;
					// 	if (rsc == '없음') {
					// 		const a_id = idCheck(idx, names[idx], inst);
					// 		id = a_id['_id'];
					// 	}
					// 	id = String(id).replace("HMO.", "");
					// 	return id;
					// }));

					// rtv = rscIds;
					resolve(rtv);
				} else {

					let inst = null;
					let names = null;
					// console.log('SITE', site);

					/*
					if (site == 'SCIENCEON') {
						// console.log('CONDITION PASSED');
						names = paper['author'].split(' ; ');
						if (paper['author_inst'] != "") {
							inst = [];
							paper['author_inst'].split(' ; ').map((temp, idx) => {
								let instArr = temp.split(names[idx]);

								if (instArr[1].length != 2) { // LENGTH 2 => (), i.e., empty inst
									inst.push(instArr[1].substring(1, instArr[1].length - 1));
								} else {
									inst.push(paper['issue_inst']);
								}
							});
						} else {
							inst = paper['issue_inst'];
						}
						// console.log("ttt");
						// console.log('NAMES', names);
						names = await Promise.all(names.map((name, idx) => {

							const id = idCheck(idx, name, inst);
							// console.log('IDCHECK', id);
							// console.log('ID', id);

							return id;
						}));
						// rtv = names;
						// console.log('rtv NAMES', names);
						resolve(names);

					}
					*/
					// else if (site == 'DBPIA') {
					// rtv = paper['author_id'].split(';');


					// rtv = paper['author_id'].split(';');
					// paper['author_id']
					console.log('PAPER[\'AUTHOR_ID\']', paper['author_id']);

					resolve(paper['author_id'].split(';'));
					// }
				}

			});
		}

		const isCheckable = () => {
			if (site == 'NTIS')
				return (paper['rscId'] != "" && paper['rscId'] != "null");
			else
				return paper['author'].split(';').length > 1;
		}

		const insertId = (id) => {
			// console.log('Insert ID', id);
			if (id !== A_ID) {
				if (typeof relationships[id] == 'undefined') {
					relationships[id] = 0;
				}
				relationships[id]++;
			}
		}


		async function idCheck(idx, name, inst) {
			return new Promise(async (resolve, reject) => {
				let _inst = "";

				if (typeof inst != 'string') {
					_inst = inst[idx];
				} else {
					_inst = inst;
				}
				if (_inst.includes("<aff"))
					_inst = _inst.split("<aff")[0];
				// console.log('_name', name);
				// console.log('_INST', _inst);
				let a_id = await dbs[site].collection(a_col).findOne({
					'name': name,
					'inst': _inst
				});
				// console.log('A_ID', a_id);

				// console.log();
				resolve(a_id['_id']);
			});
		}

		return new Promise(async (resolve) => {
			// console.log('ISCHECKABLE', isCheckable);
			if (isCheckable()) {
				// console.log('CONDITION PASSED');
				const ids = await getData();
				// console.log('IDS', ids);
				ids.forEach((id) => {
					insertId(id);
				});

			}
			resolve(relationships);
		});
	}


	getRelations().then(temp => {
		// console.log('TEMP.LENGTH', temp.length);
		if (temp.length == 0) {
			// console.log('CONDITION PASSED');

			// console.log('A_ID', A_ID);
			// console.log('KEYID', keyId);

			dbs[site].collection(ps_col).findOne({
				"A_ID": String(A_ID),
				"keyId": parseInt(keyId)
			}, function(err, a_papers) {
				console.log('A_PAPERS', a_papers);
				if (a_papers) {
					console.log('CONDITION PASSED');
					let relationships = {};
					a_papers.papers.map(x => new ObjectId(x));
					// console.log('A_PAPERS.PAPERS', a_papers.papers);

					dbs[site].collection(raw_col).find({
						"_id": {
							"$in": a_papers.papers
						}
					}).toArray(async function(err2, papers) {


						//
						// 	//});

						// });
						//
						if (papers.length > 0) {
							try {
								// console.log('PAPERS', papers);
								await Promise.all(papers.map(async (paper) => {
									// console.log('PAPER', paper);
									relationships = await getRelationships(relationships, paper);
									// console.log('RELATIONSHIPS', relationships);
									return paper;
								}));

								// relationships[A_ID] = undefined;
								// console.log('RELATIONSHIPS', relationships);
								if (Object.keys(relationships).length == 0) {
									relationships['-777'] = 0;
									// console.log('RELATIONSHIPS', relationships);
								}



								let sortedKeys = Object.keys(relationships).sort(function(a, b) {
									return relationships[b] - relationships[a];
								});
								let topKeys = sortedKeys.slice(0, topk);

								let docs = topKeys.map(key => {
									// if (relationships[key] !== undefined)
									return {
										keyId: parseInt(keyId),
										sourceAId: A_ID,
										targetAId: key,
										count: relationships[key]
									}
								});
								// console.log('DOCS', docs);
								dbs[site].collection(ar_col).insertMany(docs, function(err, result) {
									if (err)
										handleError(err, res);
									else {
										getRelations().then(temp2 => {
											// console.log('TEMP2', temp2);
											getNames(temp2);
											// console.log('GETNAMES2', getNames);
										});
									}

								});
								// console.log('	SORTABLE', docs);
							} catch (error) {
								// console.log('ERROR', error);

							}
						}
						// sortedkeys.map(key => )
						// let sortedRelationships = {};
						// sortable.forEach((item) => {
						// 	sortedRelationships[item[0]] = item[1];
						// });
						//
						//
						// console.log('RELATIONSHIPS', sortedRelationships);

					});
					// if(relationships.keys)
					// getRelations().then(temp2 => {
					// 	getNames(temp2)
					// 	console.log('GETNAMES2', getNames);
					// });
				}
			});



			//});

			// //result.papers.forEach((pid, idx) => {
			// 	dbs[site].collection(raw_col).find_one({"_id":ObjectID(pid)} , {}, function(err2, paper){
			//
			// 	//});
			// });
			//

			// let cmd = ''
			// let temp = ''
			// if (site == 'NTIS')
			// 	temp = cmds.er_cmd;
			// else
			// 	temp = cmds.er_cmd2;

			// let cmd = cmds[site + '_er'] + keyId + ' ' + A_ID + ' ' + site;
			//
			//
			// console.log('CMD', cmd);
			// let stdout = execSync(cmd); console.log('STDOUT', stdout);
			// // cmdProcess.stdout.on('data', function(data) {
			// // 	console.log('SITE ==> ', site);
			// // 	console.log('DATA', data);
			// // });
			//
			// temp = getRelations().then(temp2 => {
			// 	getNames(temp2)
			// 	console.log('GETNAMES2', getNames);
			// });
		} else {

			getNames(temp);
			// console.log('GETNAMES', getNames);
		}
	});


}

function getSiteStatus(req, res) {
	DEBUG("GET getSiteStatus");
	dbs['PUBLIC'].collection('StatusTest').find().toArray(function(err, result) {
		if (err)
			handleError(err, res);
		else
			handleResponse(result, res);
	});
}

function removeHistory(req, res) {
	DEBUG("REMOVE history");
	let {
		keyId,
		site
	} = req.query;
	// console.log(dbs);
	let k = {
		"keyId": parseInt(keyId)
	};
	let i = {
		"_id": parseInt(keyId)
	};
	console.log(k);
	sites.forEach((_site) => {
		if (site == 'ALL' || site === _site) {
			dbs[_site].collection(qk_col).deleteOne(i, function(err, result) {
				if (err)
					handleError(err, res);
			});
			dbs[_site].collection(ar_col).deleteMany(k);
			dbs[_site].collection(ef_col).deleteMany(k);
			dbs[_site].collection(raw_col).deleteMany(k);
			dbs[_site].collection(ps_col).deleteMany(k);
			dbs[_site].collection(eft_col).deleteMany(i);
		}
	});
	if (site == 'ALL') {
		dbs['PUBLIC'].collection(qk_col).deleteOne(i, function(err, result) {
			if (err)
				handleError(err, res);
		});
	}

	handleResponse({
		"ok": 1
	}, res);
}

function editHistory(req, res) {
	DEBUG("Edit history");
	let {
		_id,
		site,
		state,
		progress
	} = req.query;
	// console.log(dbs);

	dbs[site].collection(qk_col).updateOne({
		"_id": parseInt(_id)
	}, {
		'$set': {
			"state": state,
			"progress": progress
		}
	}, function(err, result) {
		// console.log('RESULT', result);
		if (err)
			handleError(err, res);

		handleResponse({
			"ok": 1
		}, res);
	});

}


function getFilterInformation(keyId, flag) {



	async function getRscResults(_id, _flag, _papers) {
		let rscs = [0, 10, 30, 50, 100];
		let rscStr = ["10명미만", "10명이상~30명미만", "30명이상~50명미만", "50명이상~100명미만", "100명이상"];

		let rtv = {};
		for (let i = 0; i < rscs.length; i++) {
			let q = [
				{
					"$expr": {
						"$gte": [{
							"$sum": [{
									"$convert": {
										"input": "$cntRscMan",
										"to": "int"
									}
								},
								{
									"$convert": {
										"input": "$cntRscWom",
										"to": "int"
									}
							}]

						}, rscs[i]]
					}
				}
			]
			let match = {
				"keyId": _id
			};


			if (i != rscs.length - 1) {
				q.push({
					"$expr": {
						"$lt": [{
							"$sum": [{
									"$convert": {
										"input": "$cntRscMan",
										"to": "int"
									}
								},
								{
									"$convert": {
										"input": "$cntRscWom",
										"to": "int"
									}
							}]

						}, rscs[i + 1]]
					}
				})

			}
			if (_flag != 0) {
				match["_id"] = {
					"$in": _papers
				}
			}

			match["$and"] = q;
			let cnt = await dbs['NTIS'].collection(raw_col).count(match);
			rtv[rscStr[i]] = cnt;
		}
		return {
			'site': "NTIS",
			'k': 'rsc',
			'v': '참여인원',
			'f': true,
			'list': rtv
		};

	}


	async function getSizeResults(_id, _flag, _papers) {
		let funds = [0, 50000000, 100000000, 300000000, 500000000, 1000000000];
		let fundStr = ["5천만원미만", "5천만원이상~1억미만", "1억이상~3억미만", "3억이상~5억미만", "5억이상~10억미만", "10억이상"];

		let rtv = {};
		for (let i = 0; i < funds.length; i++) {

			let match = {
				"keyId": _id
			};

			let q = [
				{
					"$expr": {
						"$gte": [{
							"$convert": {
								"input": "$totalFund",
								"to": "long"
							}
						}, funds[i]]
					}
				}
			]
			if (i != funds.length - 1) {
				q.push({
					"$expr": {
						"$lt": [{
							"$convert": {
								"input": "$totalFund",
								"to": "long"
							}
						}, funds[i + 1]]
					}
				})

			}
			if (_flag != 0) {
				match["_id"] = {
					"$in": _papers
				}
			}
			match['$and'] = q;
			let cnt = await dbs['NTIS'].collection(raw_col).count(match);
			rtv[fundStr[i]] = cnt;
		}
		return {
			'site': "NTIS",
			'k': 'fund',
			'v': '과제수주비',
			'f': true,
			'list': rtv
		};

	}

	function getInstResults(_site, _id, _flag, _papers) {

		return new Promise((resolve, reject) => {
			let match = {
				"keyId": _id
			};
			if (_flag != 0) {
				match["_id"] = {
					"$in": _papers
				}
			}
			dbs[_site].collection(raw_col).find(match, {}).toArray(function(err, Result) {
				if (err) {
					handleError(err, res);
				} else {
					let temp = {};
					Result.forEach((item, i) => {
						// item.author_inst


						if (item.originalName != null) {
							let stemp = item.originalName.split(";");
							if (stemp != null && stemp.length != 0) {
								let item = stemp[stemp.length - 2]
								if (temp[item] === undefined)
									temp[item] = 0;
								temp[item] += 1;

								// stemp.forEach((item, j) => {
								// 	if (item != "") {
								// 		if (temp[item] == undefined)
								// 			temp[item] = 0;
								// 		temp[item] += 1;
								// 	}
								// });
							}
						}
					});

					// console.log('AGGRES', temp);
					let rtv = {
						'site': _site,
						'k': 'inst',
						'list': temp,
						'v': '소속',
						'f': false
					};

					resolve(rtv);
				}
			});

		});
	}

	function getResults(_site, _id, field, _flag, _papers) {

		return new Promise((resolve, reject) => {
			let gQry = {
				"_id": "$" + field,
				"count": {
					"$sum": 1
				}
			};
			let match = {
				"keyId": _id
			};
			if (_flag != 0) {
				match["_id"] = {
					"$in": papers
				};
			}
			if (_site == 'NTIS' && field != "prdStart") {
				gQry['_id'] = "$originalName";
			}
			if (_site == 'DBPIA' && field == 'issue_year' || field == "prdStart") {
				gQry['_id'] = {
					"$substrBytes": ["$" + field, 0, 4]
				};
			}
			dbs[_site].collection(raw_col).aggregate([
				{
					"$match": match
				},
				{
					"$group": gQry
				}
			]).toArray(function(err, aggRes) {
				if (err) {
					handleError(err, res)
				} else {
					let temp = {};
					Object.keys(aggRes).forEach((item, i) => {
						temp[aggRes[item]._id] = aggRes[item].count;
					});

					// console.log('AGGRES', temp);
					let rtv = {
						'site': _site,
						'list': temp,
						'f': false
					};
					if (field == 'issue_year' || field == 'prdStart') {
						rtv['k'] = 'year';
						rtv['v'] = '연도';
					} else if (field == 'journal') {
						rtv['k'] = 'journal';
						rtv['v'] = '저널';
					} else {
						rtv['k'] = 'inst';
						rtv['v'] = '소속';
					}
					//
					// if (_site == 'NTIS') {
					//
					//
					// }
					resolve(rtv);
				}
			});

		});
	}
	let id = parseInt(keyId);
	// sites = sites.splice(1, sites.length);

	return new Promise(async (resolve, reject) => {
		/*
		let filters = await Promise.all(sites.map(async site => {
			let result = {};
			if (site.data != 0) {
				if (site.site == 'NTIS') {
					result = await getResults(site.site, id, 'prdStart', flag, papers);

				} else {
					result = await getResults(site.site, id, 'issue_year', flag, papers);
				}
			}
			return result;
		}));

		let filters2 = await Promise.all(sites.map(async site => {
			let result = {};
			if (site.data != 0) {
				if (site.site != 'NTIS') {
					result = await getInstResults(site.site, id, flag, papers);
				} else {

					result = await getResults(site.site, id, 'originalName', flag, papers);
				}
			}
			return result;
		}));

		let filters3 = await Promise.all(sites.map(async site => {
			let result = {};
			if (site.data != 0) {
				if (site.site != 'NTIS') {
					result = await getResults(site.site, id, 'issue_lang', flag, papers);

					// await getInstResults

				} else {
					result = await getRscResults(id, flag, papers);
				}
			}

			return result;
		}));

		let filters4 = await Promise.all(sites.map(async site => {
			let result = {};
			if (site.data != 0) {
				if (site.site != 'NTIS') {
					result = await getResults(site.site, id, 'journal', flag, papers);

				} else {
					result = await getSizeResults(id, flag, papers);

				}
			}
			return result;
		}));



		filters3 = filters4.concat(filters3);
		filters2 = filters2.concat(filters3);
		filters = filters.concat(filters2);
		// console.log('FILTERS', filters);

		let rtv = {
			'paper': {},
			'project': {}
		};




		filters.forEach((x, idx) => {
			if (Object.keys(x).length != 0) {
				if (x.site == 'NTIS') {
					rtv.project[x.k] = x;
				} else {
					if (rtv.paper[x.k] == undefined && Object.keys(x.list).length != 0) {
						// console.log("here" + x.list.length);
						rtv.paper[x.k] = x;
					} else {
						// console.log("here2" + x.list.length);
						Object.keys(x.list).forEach((k, i) => {
							if (rtv.paper[x.k].list[k] == undefined)
								rtv.paper[x.k].list[k] = 0;
							rtv.paper[x.k].list[k] += x.list[k];
						});
					}
				}
			}
		});
		*/
		dbs['PUBLIC'].collection('FilterCategory').findOne({
			"keyId": id,
			"fId": flag
		}, {}, function(err, rtv) {
			console.log('RTV', rtv);
			let makeStr = {
				'rsc': ["10명미만", "10명이상~30명미만", "30명이상~50명미만", "50명이상~100명미만", "100명이상"],
				'fund': ["5천만원미만", "5천만원이상~1억미만", "1억이상~3억미만", "3억이상~5억미만", "5억이상~10억미만", "10억이상"]
			};
			if (rtv != null) {


				Object.keys(rtv.project).forEach(f => {
					if (f != 'fund' && f != 'rsc' && f != 'year') {

						// rtv.project[f].list = TimSort({
						// 	comparer: (a, b) => (rtv.project[f].list[a] || 0) - (rtv.project[f].list[b] || 0),
						// 	inPlaceSorting: true, // default[false] => Check "In Place Sort" section for more info.
						// }).desc();
						// = sort().desc();

						rtv.project[f].list = Object.fromEntries(
							Object.entries(rtv.project[f].list).sort(([, a], [, b]) => b - a)
						);

						// Object.entries((rtv.project[f].list)).sort(([, a], [, b]) => b - a)
						// 	.reduce((r, [k, v]) => ({
						// 		...r,
						// 	[k]: v
						// 	}), {});
					}
					if (f == 'rsc' || f == 'fund') {
						// rtv.project[f].list =
						let temp = {};
						let idx = 0;
						for (const [key, value] of Object.entries(rtv.project[f].list)) {
							temp[makeStr[f][idx]] = value;
							idx++;
						}
						rtv.project[f].list = temp;
					}
					if (f == 'year') {
						// rtv.project[f].list = Object.keys(rtv.project[f].list).sort();
						// rtv.project[f].list = rtv.project[f].list => Object.keys(rtv.project[f].list).sort().reduce((r, k) => (r[k] = o[k], r), {})
						// rtv.project[f].list = Object.fromEntries(
						// 	Object.entries(rtv.project[f].list).sort(([a, ], [b, ]) => parseInt(b) - parseInt(a))
						// );
						// // rtv.project[f].list
						// console.log('RTV.PROJECT[F].LIS', rtv.project[f].list);
						// let temp = new Map();
						//
						// Object.keys(rtv.project[f].list).reverse().forEach((x) => {
						// 	temp.set(x, rtv.project[f].list[x]);
						// });
						// // let ttemp = {};
						//
						// console.log('TEMP', temp);
						// //
						// rtv.project[f].list = temp;

					}

				});

				Object.keys(rtv.paper).forEach(f => {
					if (f != 'year') {

						rtv.paper[f].list = Object.fromEntries(
							Object.entries(rtv.paper[f].list).sort(([, a], [, b]) => b - a)
						);
						// rtv.paper[f].list = sort(rtv.paper[f].list).desc();
						// rtv.paper[f].list = Object.entries(rtv.paper[f].list).sort(([, a], [, b]) => b - a)
						// 	.reduce((r, [k, v]) => ({
						// 		...r,
						// 	[k]: v
						// 	}), {});
					} else {

						// let temp2 = Object.keys(rtv.paper[f].list).sort((a, b) => parseInt(b) - parseInt(a));
						// console.log('TEMP2', temp2);
						//
						// let temp = {};
						// Object.keys(rtv.paper[f].list).sort((a, b) => parseInt(b) - parseInt(a)).forEach(k => {
						// 	temp[k] = rtv.paper[f].list[k];
						// });
						//
						// rtv.paper[f].list = temp;
						// console.log('TEMP', temp);

					}

				});
			}

			// siteExperts.forEach((x, idx) => x.rank = idx + 1);
			console.log('FILTERS', rtv);
			resolve(rtv);
		});
		//
		// 	//});
		// });
		//


	});


}

async function getIntegrationData(req, res) {
	DEBUG("GET Integration Data");

	let {
		id,
		sites
	} = req.body.data;
	// console.log(sites);
	let filters = await getFilterInformation(id, 0);
	// console.log('FILTERS', filters);
	handleResponse(filters, res);





}
//
// sites.forEach((site, i) => {
// 	// console.log('SITE', site.site);
// 	if (site.site == 'NTIS') {
// 		dbs[site.site].collection(raw_col).
// 		aggregate([
// 			{
// 				"$match": {
// 					"keyId": parseInt(id),
// 				}
// 				},
// 			{
// 				"$group": {
// 					"_id": "$ldAgency",
// 					"count": {
// 						"$sum": 1
// 					}
// 				}
// 				}
// 				]).toArray(function(err, aggRes) {
// 			if (err) {
// 				handleError(err, res);
// 				console.log('ERR', err);
// 			} else {
// 				// aggRes
// 				console.log('AGGRES', aggRes);
// 				handleResponse({
// 					"project": [{
// 						'k': 'inst',
// 						'v': '소속',
// 						'list': aggRes
// 						}]
// 				}, res);
//
// 			}
// 		});
// 	}
// });

function getMaxFID(keyId) {
	return new Promise((resolve, reject) => {

		var cur = dbs['PUBLIC'].collection('FilterInfo').find({
			'keyId': keyId
		}, {
			sort: {
				'fId': -1
			},
			limit: 1
		})
		cur.hasNext((err, result) => {
			// result
			if (err) reject(err)
			if (result) {
				cur.next().then(x => {
					resolve(x.fId)
				})
			} else {
				resolve(0)
			}
		})
	})
}

async function getIntRawResults(_data) {
	// console.log('_DATA', _data);

	return new Promise(async (resolve, reject) => {
		let _sites = ['NTIS', 'SCIENCEON', 'DBPIA', 'KCI','WOS','SCOPUS'];
		let rtv = await Promise.all(_sites.flatMap(async (site, i) => {
			let rtv = [];
			if (_data[site] !== undefined) {
				let papers = _data[site].papers.map(x => {
					return new ObjectId(x)
				});
				// console.log(site, 'PAPERS', papers);
				let raws = await dbs[site.toUpperCase()].collection(raw_col).find({
					"_id": {
						"$in": papers
					}
				}).toArray();
				raws.forEach((item) => {
					item.site = site;
				});
				rtv = raws;

			}
			return rtv;
		}));
		rtv = rtv.flatMap(item => {
			return item;
		});
		// console.log('RTV', rtv);
		// rtv = rtv.filter(x => x.length != 0);
		rtv.forEach((item, i) => {
			item.idx = i + 1;
		});
		// handleResponse(, _res);
		resolve(rtv);
	});
}


async function getIntegrationResult(req, res) {
	DEBUG("GET Integration Result");

	let {
		fId,
		keyId,
		options,
		filter,
		prevfId,
		sites
	} = req.body.data;
	console.log('KEYID', keyId);
	console.log('FID', fId);
	console.log('PREVFID', prevfId);

	console.log('FILTER', filter);
	console.log('SITES', sites);
	let paper = {};
	let project = {};
	for (const [pp, value] of Object.entries(filter)) {

		for (const [pkey, pvalue] of Object.entries(value)) {
			if (pp == 'paper') {
				paper[pkey] = pvalue.selected;
			} else {
				project[pkey] = pvalue.selected;
			}
		}
	}
	console.log('PROJECT', project);
	console.log('PAPER', paper);
	// return;
	let {
		page,
		itemsPerPage,
		sortBy,
		sortDesc
	} = options;
	console.log('OPTIONS', options);
	page = parseInt(page);
	itemsPerPage = parseInt(itemsPerPage);
	// console.log('ITEMSPERPAGE', itemsPerPage);






	function getIntResults(_project, _paper, _fId) {
		return new Promise((resolve, reject) => {
			dbs['ID'].collection('test').aggregate([
				{
					"$match": {
						"keyId": keyId,
						"fid": _fId
					}
			},
			// 	{
			// 		"$addFields": {
			// 			"count": {
			// 				"$size": {
			// 					"$objectToArray": "$$ROOT"
			// 				}
			// 			}
			// 		}
			// },
				{
					"$sort": {
						"score": -1
					}
			}
		]).skip((page - 1) * itemsPerPage).limit(itemsPerPage).toArray(async function(err, result) {

				if (err) handleError(err, res)

				if (result != null) {
					let cnt = await dbs['ID'].collection('test').count({
						"keyId": keyId,
						"fid": _fId
					})


					let all_result = await dbs['ID'].collection('test').find({
						"keyId": keyId,
						"fid": _fId
					}).toArray();


					let all_raws = [];

					let temp_sites = ['NTIS', 'SCIENCEON', 'DBPIA', 'KCI'];
					// all_result.forEach((ar) => {
					// 	temp_sites.forEach((site) => {
					// 		// console.log('SITE', site);
					// 		// ar[site]
					// 		// console.log('AR[SITE]', ar[site]);
					// 		if (ar[site] !== undefined) {
					// 			// console.log('CONDITION PASSED');
					//
					// 			ar[site].papers.map((p) => new ObjectId(p));
					// 			all_raws = all_raws.concat(ar[site].papers);
					// 		}
					// 	});
					// });
					// console.log('ALL_RAWS', all_raws);

					result = await Promise.all(result.map(async (item, i) => {
						item.idx = (page - 1) * itemsPerPage + (i + 1);
						item.raw = await getIntRawResults(item);
						// item.score = 0;
						item.score = item.score.toFixed(1);
						return item;
					}));


					// console.log('RESULT', result[0].raw);
					// console.log('ITEM', item);
					let filters = await getFilterInformation(keyId, _fId);
					if (Object.keys(filters.project).length > 0) {
						Object.keys(_project).forEach((key) => {
							if (key != 'rsc' && key != 'fund') {
								_project[key] = _project[key].map((fi) => {
									// console.log('FI', fi);
									let rtv = -1;
									Object.keys(filters['project'][key]['list']).forEach((item, idx) => {
										// console.log('FFITEM', item);
										if (item == fi) {
											rtv = idx;
											return;
										}
									});
									return rtv;
								});
							}
							_project[key] = _project[key].filter(x => x >= 0);
							filters['project'][key].selected = _project[key];
						});
					}
					if (Object.keys(filters.paper).length > 0) {
						Object.keys(_paper).forEach((key) => {
							_paper[key] = _paper[key].map((fi) => {

								let rtv = -1;
								Object.keys(filters['paper'][key]['list']).forEach((item, idx) => {

									if (item === fi) {
										rtv = idx;

										return;
									}
								});
								return rtv;
							});
							_paper[key] = _paper[key].filter(x => x >= 0);
							filters['paper'][key].selected = _paper[key];
						});
					}
					console.log('_PROJECT', _project);
					console.log('_PAPER', _paper);

					// result.totalExperts = cnt;

					handleResponse({
						"totalExperts": cnt,
						"result": result,
						"prevfId": _fId,
						"filters": filters,
						"selected": {
							'project': _project,
							'paper': _paper
						}
					}, res);


				}

			});

		});
	}

	function runIntegrationPrgm(project, paper, _fId) {
		let cmd = cmds.intergrationPrgm + _fId + ' ' + keyId;
		console.log('CMD', cmd);
		let cmdProcess = spawn(cmd, null, {
			shell: true
		});

		cmdProcess.on('exit', (exitCode) => {
			if (parseInt(exitCode) !== 0) {
				console.log('EXITCODE', exitCode);
			}
			getIntResults(project, paper, _fId);
		});
		cmdProcess.stderr.on('data', function(data) {
			console.log('DATA', data.toString());
		});
		cmdProcess.stdout.on('data', function(data) {
			console.log('DATA', data.toString());
		});
		console.log("here");
	}

	// console.log('PROJECT', project);
	// console.log('PAPER', paper);
	if (fId == -1) {

		Object.keys(project).forEach((key) => {
			if (key != 'rsc' && key != 'fund' && key != 'year') {

				if (project[key].length > 0) {

					project[key] = project[key].map((fi) => {
						// console.log('FI', fi);
						// filter['project'][key]['list'][fi];
						// console.log('FILTER[\'PROJECT\'][KEY][\'LIST\'][FI]', filter['project'][key]['list']);

						return Object.keys(filter['project'][key]['list'])[fi];
					});
				}
			}
		});
		Object.keys(paper).forEach((key) => {
			// console.log('KEY', key);
			if (key != 'year') {
				if (paper[key].length > 0) {
					// console.log('CONDITION PASSED');
					paper[key] = paper[key].map((fi) => {
						let temp = "";
						temp = Object.keys(filter['paper'][key]['list'])[fi];
						// if (key == 'journal' || key == 'inst') {
						// 	// temp = temp.replace(/^/gi, ".");
						// }
						return temp;
					});
				} else {
					paper[key] = [];
				}
			}
		});
		console.log('PROJECT', project);
		console.log('PAPER', paper);

		let gFilters = await dbs['PUBLIC'].collection('FilterInfo').find({
			"keyId": keyId
		}).toArray();


		let flag = true;
		// if(gFilters.length == 0){
		// 	flag = true;
		// }
		gFilters.forEach((item) => {
			flag = false;
			Object.keys(item.pFilter).forEach((pF) => {
				if (item.pFilter[pF].length == paper[pF].length) {
					let t = item.pFilter[pF].map((queryFilter) => {
						// console.log('QUERYFILTER', paper[pF].findIndex('0'));
						return paper[pF].indexOf(queryFilter);
					}).filter(x => x < 0);
					// console.log(t.length);
					if (t.length > 0) {
						flag = true;
						return;
					}
				} else {
					flag = true;
					return;
				}
			});
			Object.keys(item.nFilter).forEach((nF) => {
				if (item.nFilter[nF].length == project[nF].length) {
					let t = item.nFilter[nF].map((queryFilter) => {
						return project[nF].indexOf(queryFilter);
					}).filter(x => x < 0);
					if (t.length > 0) {
						flag = true;
						return;
					}
				} else {
					flag = true;
					return;
				}
			});
			if (!flag) {
				fId = item.fId;
				return;
			}
			flag = true;
		});
		console.log('GETMAXFID(588)', fId, flag);

		if (flag) {
			fId = await getMaxFID(keyId) + 1;
			dbs['PUBLIC'].collection('FilterInfo').insertOne({
					"keyId": keyId,
					"fId": fId,
					"nFilter": project,
					"pFilter": paper
				},
				function(err, insRes) {
					if (err) reject(err);
					runIntegrationPrgm(project, paper, fId);
				});
		} else {
			getIntResults(project, paper, fId);
		}
	} else {

		dbs['ID'].collection('test').findOne({
			"keyId": keyId,
			"fid": fId
		}, {}, function(err, result) {
			if (err) handleError(err, res);

			if (result == null) {
				//run integration sync
				runIntegrationPrgm(project, paper, fId);
			} else {
				getIntResults(project, paper, fId);
			}

		});
	}


}


async function getReloadPage(req, res) {
	DEBUG("GET getReloadPage");

	let {
		keyId,
		options,
		fId,
	} = req.body.data;
	console.log('KEYID', keyId);
	console.log('FID', fId);
	console.log('OPTIONS', options);
	let {
		page,
		itemsPerPage,
		sortBy,
		sortDesc
	} = options;
	let sort = {};
	let k = {
		true: 1,
		false: -1
	};
	if (sortBy.length > 0) {
		sort[sortBy[0]] = k[sortDesc[0]];


		// if (sortBy[0] == 'name') {
		// 	sort = {
		// 		"name": k[sortDesc[0]]
		// 	};
		// }
		// else if()
	} else {
		sort = {
			"score": -1
		};
	}
	dbs['ID'].collection('test').aggregate([
		{
			"$match": {
				"keyId": keyId,
				"fid": fId
			}
	},
		{
			"$sort": sort
	}
	]).skip((page - 1) * itemsPerPage).limit(itemsPerPage).toArray(async function(err, result) {

		if (err) handleError(err, res)

		result = await Promise.all(result.map(async (item, i) => {
			item.idx = (page - 1) * itemsPerPage + (i + 1);
			item.score = item.score.toFixed(1);
			item.raw = await getIntRawResults(item);
			return item;
		}));


		handleResponse({
			"result": result,
		}, res);




	});



}

function deleteIntegration(req, res) {
	DEBUG("GET deleteIntegration");
	let {
		keyId
	} = req.query;
	DEBUG(keyId)

	dbs['PUBLIC'].collection('FilterInfo').deleteMany({
		"keyId": parseInt(keyId)
	});
	dbs['ID'].collection('International').deleteMany({
		"keyId": parseInt(keyId),
		"fid": {
			"$ne": 0
		}
	})
	dbs['ID'].collection('Domestic').deleteMany({
		"keyId": parseInt(keyId),
		"fid": {
			"$ne": 0
		}
	})
	dbs['ID'].collection('test').deleteMany({
		"keyId": parseInt(keyId),
		"fid": {
			"$ne": 0
		}
	})
	dbs['PUBLIC'].collection('FilterCategory').deleteMany({
		"keyId": parseInt(keyId),
		"fId": {
			"$ne": 0
		}
	})
	dbs['PUBLIC'].collection('new_factor').deleteMany({
		"keyId": parseInt(keyId),
		"fId": {
			"$ne": 0
		}
	})
	handleResponse({}, res);
}

function getInstRank(req, res) {

	DEBUG("GET Rankinst")
	let {
		keyId
	} = req.query;
	DEBUG(keyId)

 	 dbs['PUBLIC'].collection(rank_col).findOne({
			"keyId": parseInt(keyId)
		}, {},
		function(err, result) {
			if (err) handleError(err, res)

			if (result != null) {
				const sortable = Object.entries(result['Insts'])
  		.sort(([, a], [, b]) => b - a)
  		.reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
			let j = 0
			let dict = {}
			for(let i in sortable){
				if (j<3){
				dict[i] = String(i)+' : '+sortable[i]
				j+=1
			}
		}
			result['Insts'] = dict


			  console.log("getRankinst complete ")
				//console.log("sortable",sortable)
				handleResponse(result, res);


			}

		})
}
function getNtisAPI(req, res) {
	DEBUG("GET NTISAPI")
	let {
		A_list
	} = req.query;

	console.log("a_col",a_col)
	console.log("A_list",A_list)

		dbs['NTIS'].collection(a_col).find({
			_id: { $in: A_list }
		}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
		const url = [];
		for (const element of result) {
			if (element['ntis_URL'] != null){
			 //url.push(element['ntis_URL'])
			 url.push(element)
			 console.log(url)
		}
	}
				 handleResponse(url, res)

  });

}




module.exports = {
	getHistories,
	requestSearch,
	getDetailHistory,
	getExperts,
	getExpertRelation,
	getExpertPapers,
	uploadIFFile,
	sendCrawlRequest,
	getSiteStatus,
	removeHistory,
	editHistory,
	getIntegrationData,
	getIntegrationResult,
	getReloadPage,
	deleteIntegration,
	getInstRank,
	getNtisAPI
}
