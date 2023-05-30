var express = require('express');
var router = express.Router()
var fs = require('fs')
const uuidV1 = require('uuid/v1')
const xlsx = require('node-xlsx');
const catsubcat = xlsx.parse('POI_TABLEalignedtoontology.xlsx');
const visitimes = xlsx.parse('POI_TABLEalignedtoontologytime.xlsx');
var interchobject = JSON.parse(fs.readFileSync('EOAE_interchange_84.geojson', 'utf8'));
const { RDFMimeType } = require('graphdb').http;
const { RepositoryClientConfig, RDFRepositoryClient } = require('graphdb').repository;
const { SparqlJsonResultParser } = require('graphdb').parser;
const { UpdateQueryPayload, GetQueryPayload, QueryType } = require('graphdb').query;
const axios = require('axios');
const geolib = require('geolib');
const jsesc = require('jsesc');
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
router.use(bodyParser.json({ limit: '100mb' }))

function getvmsapilink(){
    axios({
        method: 'get',
        url: urlvms
    }).then (function (response){
        responsevms = response.data
    }).catch(function(error){
        console.log(error)
        responsevms = error
    })
    }

const urlvms = 'http://egnatia.link-tech.gr/exnilatis/api/VMS'
getvmsapilink();
setInterval( function(){ getvmsapilink();} , 300000)


axios.post('http://localhost:7200/rest/login/admin', null, {
    headers: {
        'X-GraphDB-Password': '*'
    }
}).then(function (token) {

    router.get('/linkapivms', (req, res) => { 
        res.send(JSON.stringify(responsevms))
    })

    router.get('/sync', (req, res) => {

        let requestdata = JSON.stringify(req.body)
        requestdata = requestdata.replace(/\\n/g, '')
        fs.writeFileSync('20200703_db_poi.json', requestdata, function (err) {
            if (err) return console.log(err);
        })

        let promises101 = []
        let inserturl = 'http://160.40.52.169:3001/addpoisfromfilev3'
        promises101.push(axios({
            method: 'get',
            url: inserturl,
            auth: {
                username: '*',
                password: '*'
            }
        }).then(nestresp => {if (nestresp['data'] == 'OK') { res.sendStatus('200')}}
	).catch(error => {
		res.status(500).send(error)
	}))
        
    })

    router.get('/reduceontime/:time/:amea/:listofids/:timemod', (req, res) => {

        let timeinmins = parseInt(req.params.time)
        let ameapres = req.params.amea
        let listofids = req.params.listofids.split(',')
        let timemod = parseFloat(req.params.timemod)
        let promises66 = []
        let list71 = []
        let urlids2 = 'http://localhost:3001/getids/' + listofids + ''
        promises66.push(axios({
            method: 'get',
            url: urlids2,
            auth: {
                username: '*',
                password: '*'
            }
        }).catch(error =>{
		res.status(500).send(error)

	}))
        Promise.all(promises66).then(resp => {
            resp.forEach(function (datum) {
                datum['data'].forEach(function (entity) {
                    //console.log(entity)
                    if (ameapres == 'true' && (entity[9]['name'] != 'true' || entity[8]['name'] != 'true')) {
                        return;
                    }
                    if (ameapres == 'false' && (entity[9]['name'] != 'false' || entity[8]['name'] != 'false')) {
                        return;
                    }
                    let count = 0
                    for (let ii = 0; ii < 3; ii++) {
			try{
                        if ((entity[ii]['id'] === "type")) {
                            count++
                        }} catch (error) {
				continue}
                    }
                    if (timeinmins == 0) {
                        list71.push(entity)
                    }
                    else if (count == 2) {
                        for (let iterarr = 0; iterarr < 21; iterarr++) {
                            for (let iterarr2 = 0; iterarr2 < 11; iterarr2++) {
                                if (entity[count - 1]["name"] === catsubcat[1]['data'][iterarr][iterarr2]) {
                                    if (visitimes[1]['data'][iterarr + 1][iterarr2] * timemod <= timeinmins) {
                                        list71.push(entity)
                                    }
                                }
                            }
                        }
                    }
                    else if (count == 3) {
                        for (let iterarr = 0; iterarr < 21; iterarr++) {
                            for (let iterarr2 = 0; iterarr2 < 11; iterarr2++) {
                                if (entity[count - 2]["name"] === catsubcat[1]['data'][iterarr][iterarr2]) {

                                    if (visitimes[1]['data'][iterarr][iterarr2] * timemod <= timeinmins) {
                                        list71.push(entity)
                                    }
                                }
                            }
                        }
                    }
                })
            })
            res.send(list71)
            delete list71
            delete promises66
        }).catch(err => console.log(err))
    })

    router.get('/reduceontime/:time/:amea/:listofids', (req, res) => {

        let timeinmins = parseInt(req.params.time)
        let ameapres = req.params.amea
        let listofids = req.params.listofids.split(',')
        let promises52 = []
        let list7 = []
        let urlids2 = 'http://160.40.52.169:3001/getids/' + listofids + ''
        promises52.push(axios({
            method: 'get',
            url: urlids2,
            auth: {
                username: '*',
                password: '*'
            }
        }))
        Promise.all(promises52).then(resp => {
            resp.forEach(function (datum) {
                datum['data'].forEach(function (entity) {
                    if (ameapres == 'true' && (entity[9]['name'] != 'true' || entity[8]['name'] != 'true')) {
                        return;
                    }
                    if (ameapres == 'false' && (entity[9]['name'] != 'false' || entity[8]['name'] != 'false')) {
                        return;
                    }
                    let count = 0
                    for (let ii = 0; ii < 3; ii++) {
                        if ((entity[ii]['id'] === "type")) {
                            count++
                        }
                    }
                    if (timeinmins == 0) {
                        list7.push(entity)
                    }
                    else if (count == 2) {
                        for (let iterarr = 0; iterarr < 21; iterarr++) {
                            for (let iterarr2 = 0; iterarr2 < 11; iterarr2++) {
                                if (entity[count - 1]["name"] === catsubcat[1]['data'][iterarr][iterarr2]) {
                                    if (visitimes[1]['data'][iterarr + 1][iterarr2] <= timeinmins) {
                                        list7.push(entity)
                                    }
                                }
                            }
                        }
                    }
                    else if (count == 3) {
                        for (let iterarr = 0; iterarr < 21; iterarr++) {
                            for (let iterarr2 = 0; iterarr2 < 11; iterarr2++) {
                                if (entity[count - 2]["name"] === catsubcat[1]['data'][iterarr][iterarr2]) {

                                    if (visitimes[1]['data'][iterarr][iterarr2] <= timeinmins) {
                                        list7.push(entity)
                                    }
                                }
                            }
                        }
                    }
                })
            })
            res.send(list7)
            delete list7
            delete promises52
        })
    })

    router.get('/insertpois', (req, res) => {

        var twice = 0
        while (twice < 2) {
            let promises9 = []
            let urlid9 = 'http://160.40.52.169:3001/addpoisfromfilev2'
            promises9.push(axios({
                method: 'get',
                url: urlid9,
                auth: {
                    username: '*',
                    password: '*'
                }
            }))
            twice++;
        }
        res.send("OK")
    })

    router.get('/addpoisfromfilev3', (req, res) => {

            console.log(1)
            var geobject2 = JSON.parse(fs.readFileSync('20200703_db_poi.json', 'utf-8'))
            console.log(2)
            let promises5 = []
            const readTimeout = 300000;
            const writeTimeout = 300000;
            const repositoryClientConfig = new RepositoryClientConfig(['http://localhost:7200/repositories/V2'],
                { 'authorization': token.headers.authorization },
                '', readTimeout, writeTimeout);
            const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
            repositoryClient.deleteAllStatements();
            console.log('Knowledge Graph Wiped')
            const contentType = RDFMimeType.RDF_XML;
            const turtleFile = '/home/estathop/Desktop/eTracer Server Back UP 21.6.20/Ontology/V2.0 W/O Data.owl';
            repositoryClient.addFile(turtleFile, contentType)
            console.log("Ontology Imported Successfully")
            console.log(3)
            let urlid5 = 'http://localhost:3001/addinterchanges'
            promises5.push(axios({
                method: 'get',
                url: urlid5,
                auth: {
                    username: '*',
                    password: '*'
                }
            }))
            console.log(4)
            fs.writeFileSync('syncbackup.ttl', '@prefix : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> . \n@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> . \n@prefix geo: <http://www.opengis.net/ont/geosparql#> . \n', function (err) {
                if (err) return console.log(err);
                console.log('something with files went wrong !');
              });
              console.log(5)
                geobject2['features'].forEach(function (element) {
                let poivar = uuidV1();
                var instoftype = [];
                if (typeof (element['geometry']['coordinates'][0]) == "object") {
                    let tempvar = element['geometry']['coordinates'][0][1]
                    element['geometry']['coordinates'][0] = element['geometry']['coordinates'][0][0]
                    element['geometry']['coordinates'][1] = tempvar
                };
                element['properties']['name'] = element['properties']['name'].replace(/[^a-zA-Z0-9ά-ωΑ-ώ]/gi, '') + '' + element['id'];
                element['properties']['subcategory'].forEach(function (subcateg) {
                
                    col = +subcateg.substring(0, 2);
                    row = +subcateg.substring(2, 4);
                    instoftype.push(catsubcat[1]['data'][row + 2][col + 1])
                
                })
                element['properties']['category'].forEach(function (categ){
                    col = +categ
                    instoftype.push(catsubcat[1]['data'][1][col+1])
                })
                if (element['properties']['full_descr'] != null) {
    
                    element['properties']['full_descr'] = jsesc(element['properties']['full_descr'], { 'minimal': true });
                    element['properties']['full_descr'] = element['properties']['full_descr'].replace(/\\\\n/g, "n").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                }
    
                if (element['properties']['s_descr'] != null) {
    
                    element['properties']['s_descr'] = jsesc(element['properties']['s_descr'], { 'minimal': true });
                    element['properties']['s_descr'] = element['properties']['s_descr'].replace(/\\\\n/g, "n").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                }
                fs.appendFileSync('syncbackup.ttl', ':'+ element['properties']['name']+' rdf:type :POI')
                instoftype.forEach(function (loopiter){
                  fs.appendFileSync('syncbackup.ttl', ', :'+loopiter+' ')
                })
                
                fs.appendFileSync('syncbackup.ttl', ' . \n')
                fs.appendFileSync('syncbackup.ttl','\
                :'+ element['properties']['name'] + ' rdf:type owl:NamedIndividual. \n \
                :'+ element['properties']['name'] + ' rdf:type :POI . \n\
                :'+ element['properties']['name'] + ' :POIhasID "' + element['id'] + '". \n\
                :'+ element['properties']['name'] + ' :isOfHistoricPeriod "' + element['properties']['historic_period'].toString() + '". \n\
                :'+ element['properties']['name'] + ' :hasNameGr "' + element['properties']['name'] + '". \n\
                :'+ element['properties']['name'] + ' :hasNameEng "' + element['properties']['name_eng'] + '". \n\
                :'+ element['properties']['name'] + ' :hasShortDescriptionGr "' + element['properties']['s_descr'] + '". \n\
                :'+ element['properties']['name'] + ' :hasShortDescriptionEng "' + element['properties']['s_descr_eng'] + '". \n\
                :'+ element['properties']['name'] + ' :hasFullDescriptionGr "' + element['properties']['full_descr'] + '". \n\
                :'+ element['properties']['name'] + ' :hasFullDescriptionEng "' + element['properties']['full_descr_eng'] + '". \n\
                :'+ element['properties']['name'] + ' :belongToRegion "' + element['properties']['periferia'] + '". \n\
                :'+ element['properties']['name'] + ' :belongsToRegionalUnit "' + element['properties']['per_enotita'] + '". \n\
                :'+ element['properties']['name'] + ' :belongsToMunicipality "' + element['properties']['dimos'] + '".\n\
                :'+ element['properties']['name'] + ' :hasAddress "' + element['properties']['address'] + '".\n\
                :'+ element['properties']['name'] + ' :hasPhoneNumber "' + element['properties']['telephone'] + '".\n\
                :'+ element['properties']['name'] + ' :hasEmail "' + element['properties']['email'] + '". \n\
                :'+ element['properties']['name'] + ' :hasWebsite "' + element['properties']['website'] + '". \n\
                :'+ element['properties']['name'] + ' :hasAverageDurationOfVisit "' + element['properties']['time_spent'] + '". \n\
                :'+ element['properties']['name'] + ' :hasTicketCost "' + element['properties']['ticket_cost'] + '". \n\
                :'+ element['properties']['name'] + ' :hasAmeaAccess "' + element['properties']['amea_access'] + '". \n\
                :'+ element['properties']['name'] + ' :supportsAR "' + element['properties']['is_ar'] + '". \n\
                :'+ element['properties']['name'] + ' :hasDifficultyLevel "' + element['properties']['difficulty_lvl'] + '". \n\
                :'+ element['properties']['name'] + ' :hasCategoryOfSource "' + element['properties']['source_cat'] + '". \n\
                :'+ element['properties']['name'] + ' :isPublished "' + element['properties']['published'] + '". \n\
                :'+ element['properties']['name'] + ' :isProtected "' + element['properties']['protected'] + '". \n\
                :'+ element['properties']['name'] + ' :isUnderUnesco "' + element['properties']['unesco'] + '". \n\
                :'+ element['properties']['name'] + ' :hasWC "' + element['properties']['wc'] + '". \n\
                :'+ element['properties']['name'] + ' :providesShopping "' + element['properties']['shopping'] + '". \n\
                :'+ element['properties']['name'] + ' :providesFood "' + element['properties']['food'] + '". \n\
                :'+ element['properties']['name'] + ' :providesInternalRoutes "' + element['properties']['routes'] + '". \n\
                :'+ element['properties']['name'] + ' :providesInfoMaterial "' + element['properties']['info_material'] + '". \n\
                :'+ element['properties']['name'] + ' :hasExhibitionFacility "' + element['properties']['exhibition'] + '". \n\
                :'+ element['properties']['name'] + ' :hasParkingSlots "' + element['properties']['parking'] + '". \n\
                :'+ element['properties']['name'] + ' :hasBeenAwarded "' + element['properties']['awards'] + '". \n\
                :'+ element['properties']['name'] + ' :isCertified "' + element['properties']['certification'] + '". \n\
                :'+ element['properties']['name'] + ' :providesAccomodation "' + element['properties']['accommodation'] + '". \n\
                :'+ element['properties']['name'] + ' :providesCatering "' + element['properties']['restaurant'] + '". \n\
                :'+ element['properties']['name'] + ' :hasRecreationalAreas "' + element['properties']['recreational_areas'] + '". \n\
                :'+ element['properties']['name'] + ' :hasCulturalFacility "' + element['properties']['cultural'] + '".\n \
                :'+ element['properties']['name'] + ' :providesShelter "' + element['properties']['refuge'] + '".\n \
                :'+ element['properties']['name'] + ' :hasObservatories "' + element['properties']['observatories'] + '". \n\
                :'+ element['properties']['name'] + ' :isSuitableForOutdoorActivities "' + element['properties']['outdoor_activities'] + '". \n\
                :'+ element['properties']['name'] + ' :isCertifiedOutdoorCompany "' + element['properties']['outdoor_company'] + '".\n \
                :'+ poivar + ' rdf:type :GPSPoint. \n\
                :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Point>. \n\
                :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Geometry>. \n\
                :'+ poivar + ' rdf:type owl:NamedIndividual. \n\
                :'+ poivar + ' geo:asWKT \"POINT(' + element['geometry']['coordinates'][0] + ' ' + element['geometry']['coordinates'][1] + ')\"^^geo:wktLiteral. \n\
                :'+ element['properties']['name'] + ' rdf:type geo:Feature. \n\
                :'+ element['properties']['name'] + ' geo:hasGeometry :' + poivar + '. \n ')
                
                let enumday = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                if (element['properties']['open_hours']!=null && element['properties']['open_hours']!=""){
                    console.log("openhours")
                    console.log(element['properties']['open_hours'])
                    for( let weekloop = 0; weekloop<enumday.length; weekloop++){
                        
                        if(JSON.parse(element['properties']['open_hours'])[weekloop]!=null){
                          
                            fs.appendFileSync('syncbackup.ttl', '\
                            :'+ poivar+''+enumday[weekloop]+' rdf:type :POISchedule . \n\
                            :'+element['properties']['name']+' :hasSchedule :'+ poivar+''+enumday[weekloop]+'. \n\
                            :'+ poivar+''+enumday[weekloop]+' time:dayOfWeek time:'+enumday[weekloop]+'. \n\
                            :'+ poivar+''+enumday[weekloop]+' time:hasBeginning :'+JSON.parse(element['properties']['open_hours'])[weekloop][0]+' . \n\
                            :'+ poivar+''+enumday[weekloop]+' time:hasEnd :'+JSON.parse(element['properties']['open_hours'])[weekloop][1]+' . \n\
                            ')
                        }  
                }}    
            
            })
            try{
            console.log(8)
            var contentType2 = RDFMimeType.TURTLE;
            console.log(7)
            fs.readFile('syncbackup.ttl', (err, stream) => {
            repositoryClient.upload(stream, contentType2);
            });
            console.log(8)
            console.log('Insertion of POIs complete')
            res.sendStatus(200)
        } catch (err) { 
        console.log('error in /addpoisfromfilev3 api' + err)
        res.status(500).send(err)
        }
        })

    router.get('/addpoisfromfilev2', (req, res) => {
	
	try{
        var geobject2 = JSON.parse(fs.readFileSync('20200703_db_poi.json', 'utf-8'))
        let promises5 = []
        const readTimeout = 300000;
        const writeTimeout = 300000;
        const repositoryClientConfig = new RepositoryClientConfig(['http://localhost:7200/repositories/V2'],
            { 'authorization': token.headers.authorization },
            '', readTimeout, writeTimeout);
        const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
        repositoryClient.deleteAllStatements();
        console.log('Knowledge Graph Wiped')
        const contentType = RDFMimeType.RDF_XML;
        const turtleFile = '/Users/evan/Desktop/eTracer/eTracer.Code/Ontology/V2.0 W/O Data.owl';
        repositoryClient.addFile(turtleFile, contentType)
        console.log("Ontology Imported Successfully")
        let urlid5 = 'http://localhost:3001/addinterchanges'
        promises5.push(axios({
            method: 'get',
            url: urlid5,
            auth: {
                username: '*',
                password: '*'
            }
        }))
        fs.writeFileSync('syncbackup.ttl', '@prefix : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> . \n@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> . \n', function (err) {
            if (err) return console.log(err);
            console.log('Hello World > helloworld.txt');
          });
        geobject2['features'].forEach(function (element) {
            let poivar = uuidV1();
            var instoftype = [];
            if (typeof (element['geometry']['coordinates'][0]) == "object") {
                let tempvar = element['geometry']['coordinates'][0][1]
                element['geometry']['coordinates'][0] = element['geometry']['coordinates'][0][0]
                element['geometry']['coordinates'][1] = tempvar
            };
            element['properties']['name'] = element['properties']['name'].replace(/[^a-zA-Z0-9ά-ωΑ-ώ]/gi, '') + '' + element['id'];
            element['properties']['subcategory'].forEach(function (subcateg) {
                col = +subcateg.substring(0, 2);
                row = +subcateg.substring(2, 4);
                instoftype.push(catsubcat[1]['data'][row + 2][col + 1])
            })
            element['properties']['category'].forEach(function (categ){
                col = +categ
                instoftype.push(catsubcat[1]['data'][1][col+1])
            })
            if (element['properties']['full_descr'] != null) {

                element['properties']['full_descr'] = jsesc(element['properties']['full_descr'], { 'minimal': true });
                element['properties']['full_descr'] = element['properties']['full_descr'].replace(/\\\\n/g, "n").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            }

            if (element['properties']['s_descr'] != null) {

                element['properties']['s_descr'] = jsesc(element['properties']['s_descr'], { 'minimal': true });
                element['properties']['s_descr'] = element['properties']['s_descr'].replace(/\\\\n/g, "n").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            }
            fs.appendFileSync('syncbackup.ttl', ':'+ element['properties']['name']+' rdf:type :POI')
            instoftype.forEach(function (loopiter){
              fs.appendFileSync('syncbackup.ttl', ', :'+loopiter+' ')
            })
            fs.appendFileSync('syncbackup.ttl', ' . \n')
            const readTimeout = 300000;
            const writeTimeout = 300000;
            const repositoryClientConfig = new RepositoryClientConfig(['http://localhost:7200/repositories/V2'],
                { 'authorization': token.headers.authorization },
                '', readTimeout, writeTimeout);
            const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
            repositoryClient.registerParser(new SparqlJsonResultParser());
            const payload = new UpdateQueryPayload()
                .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
            PREFIX geo: <http://www.opengis.net/ont/geosparql#> \
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
            \
            INSERT DATA { \
            :'+ element['properties']['name'] + ' rdf:type owl:NamedIndividual. \
            :'+ element['properties']['name'] + ' rdf:type :POI . \
            :'+ element['properties']['name'] + ' :POIhasID "' + element['id'] + '". \
            :'+ element['properties']['name'] + ' :isOfHistoricPeriod "' + element['properties']['historic_period'].toString() + '". \
            :'+ element['properties']['name'] + ' :hasNameGr "' + element['properties']['name'] + '". \
            :'+ element['properties']['name'] + ' :hasNameEng "' + element['properties']['name_eng'] + '". \
            :'+ element['properties']['name'] + ' :hasShortDescriptionGr "' + element['properties']['s_descr'] + '". \
            :'+ element['properties']['name'] + ' :hasShortDescriptionEng "' + element['properties']['s_descr_eng'] + '". \
            :'+ element['properties']['name'] + ' :hasFullDescriptionGr "' + element['properties']['full_descr'] + '". \
            :'+ element['properties']['name'] + ' :hasFullDescriptionEng "' + element['properties']['full_descr_eng'] + '". \
            :'+ element['properties']['name'] + ' :belongToRegion "' + element['properties']['periferia'] + '". \
            :'+ element['properties']['name'] + ' :belongsToRegionalUnit "' + element['properties']['per_enotita'] + '". \
            :'+ element['properties']['name'] + ' :belongsToMunicipality "' + element['properties']['dimos'] + '".\
            :'+ element['properties']['name'] + ' :hasAddress "' + element['properties']['address'] + '".\
            :'+ element['properties']['name'] + ' :hasPhoneNumber "' + element['properties']['telephone'] + '".\
            :'+ element['properties']['name'] + ' :hasEmail "' + element['properties']['email'] + '". \
            :'+ element['properties']['name'] + ' :hasWebsite "' + element['properties']['website'] + '". \
            :'+ element['properties']['name'] + ' :hasAverageDurationOfVisit "' + element['properties']['time_spent'] + '". \
            :'+ element['properties']['name'] + ' :hasTicketCost "' + element['properties']['ticket_cost'] + '". \
            :'+ element['properties']['name'] + ' :hasAmeaAccess "' + element['properties']['amea_access'] + '". \
            :'+ element['properties']['name'] + ' :supportsAR "' + element['properties']['is_ar'] + '". \
            :'+ element['properties']['name'] + ' :hasDifficultyLevel "' + element['properties']['difficulty_lvl'] + '". \
            :'+ element['properties']['name'] + ' :hasCategoryOfSource "' + element['properties']['source_cat'] + '". \
            :'+ element['properties']['name'] + ' :isPublished "' + element['properties']['published'] + '". \
            :'+ element['properties']['name'] + ' :isProtected "' + element['properties']['protected'] + '". \
            :'+ element['properties']['name'] + ' :isUnderUnesco "' + element['properties']['unesco'] + '". \
            :'+ element['properties']['name'] + ' :hasWC "' + element['properties']['wc'] + '". \
            :'+ element['properties']['name'] + ' :providesShopping "' + element['properties']['shopping'] + '". \
            :'+ element['properties']['name'] + ' :providesFood "' + element['properties']['food'] + '". \
            :'+ element['properties']['name'] + ' :providesInternalRoutes "' + element['properties']['routes'] + '". \
            :'+ element['properties']['name'] + ' :providesInfoMaterial "' + element['properties']['info_material'] + '". \
            :'+ element['properties']['name'] + ' :hasExhibitionFacility "' + element['properties']['exhibition'] + '". \
            :'+ element['properties']['name'] + ' :hasParkingSlots "' + element['properties']['parking'] + '". \
            :'+ element['properties']['name'] + ' :hasBeenAwarded "' + element['properties']['awards'] + '". \
            :'+ element['properties']['name'] + ' :isCertified "' + element['properties']['certification'] + '". \
            :'+ element['properties']['name'] + ' :providesAccomodation "' + element['properties']['accommodation'] + '". \
            :'+ element['properties']['name'] + ' :providesCatering "' + element['properties']['restaurant'] + '". \
            :'+ element['properties']['name'] + ' :hasRecreationalAreas "' + element['properties']['recreational_areas'] + '". \
            :'+ element['properties']['name'] + ' :hasCulturalFacility "' + element['properties']['cultural'] + '". \
            :'+ element['properties']['name'] + ' :providesShelter "' + element['properties']['refuge'] + '". \
            :'+ element['properties']['name'] + ' :hasObservatories "' + element['properties']['observatories'] + '". \
            :'+ element['properties']['name'] + ' :isSuitableForOutdoorActivities "' + element['properties']['outdoor_activities'] + '". \
            :'+ element['properties']['name'] + ' :isCertifiedOutdoorCompany "' + element['properties']['outdoor_company'] + '". \
            :'+ poivar + ' rdf:type :GPSPoint. \
            :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Point>. \
            :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Geometry>. \
            :'+ poivar + ' rdf:type owl:NamedIndividual. \
            :'+ poivar + ' geo:asWKT \"POINT(' + element['geometry']['coordinates'][0] + ' ' + element['geometry']['coordinates'][1] + ')\"^^geo:wktLiteral. \
            :'+ element['properties']['name'] + ' rdf:type geo:Feature. \
            :'+ element['properties']['name'] + ' geo:hasGeometry :' + poivar + '. \
            }\
            ')
                .setContentType('application/x-www-form-urlencoded')
                .setInference(true)
                .setTimeout(5);
            repositoryClient.update(payload).then(() => {
            }).catch(err => console.log(err));
        })
        var contentType2 = RDFMimeType.TURTLE;
        fs.readFile('syncbackup.ttl', (err, stream) => {
        repositoryClient.upload(stream, contentType2);
        });
        console.log('Insertion of POIs complete')
        res.sendStatus(200)
    } catch (err) { 
	console.log('error in /addpoisfromfilev2 api' + err)
	res.status(500).send(err)
	}
	})

    router.get('/getdtldpoisplain/:interch/:time/:dist/:amea/:start/:dest', (req, res) => {

        let startingpoint = req.params.start.split(',')
        let destinationpoint = req.params.dest.split(',')
        let interchangeIDs = req.params.interch
        let interchangeID = interchangeIDs.split(',')
        let timeoftravel = req.params.time
        let distoftravel = req.params.dist
        let ameaoftravel = req.params.amea
        let promises3 = []
        let list3 = []
        var set = new Set()
        interchangeID.forEach(function (id) {
            let urlid = 'http://160.40.52.169:3001/getdtldpoisbyint/' + id + '/' + timeoftravel + '/' + distoftravel + '/' + ameaoftravel + ''
            promises3.push(axios({
                method: 'get',
                url: urlid,
                auth: {
                    username: '*',
                    password: '*'
                }
            }))
        })
        Promise.all(promises3).then(resp => {
            resp.forEach(function (datum) {
                datum['data'].forEach(function (entity) {
                    for (var iii = 0; entity.length; iii++) {
                        if (entity[iii]['id'] == "POIhasID") {

                            if (!set.has(entity[iii]['name'])) {
                                set.add(entity[iii]['name'])
                                entity.push({ id: "distance_from_start", name: geolib.getDistance({ latitude: startingpoint[0], longitude: startingpoint[1] }, { latitude: latpoi = entity.slice(-1)[0]["name"].replace('(', ' ').replace(')', '').split(' ')[1], longitude: longpoi = entity.slice(-1).pop()["name"].replace('(', ' ').replace(')', '').split(' ')[2] }) })
                                entity.push({ id: "distance_from_destination", name: geolib.getDistance({ latitude: destinationpoint[0], longitude: destinationpoint[1] }, { latitude: latpoi, longitude: longpoi }) })
                                list3.push(entity)
                            }
                            break
                        }
                    }
                })
            })
            res.send(list3)
            delete set;
            delete promises3;
            delete list3;
        })
    })

    router.get('/getdtldpoisplain/:interch/:time/:dist/:amea', (req, res) => {
        let interchangeIDs = req.params.interch
        let interchangeID = interchangeIDs.split(',')
        let timeoftravel = req.params.time
        let distoftravel = req.params.dist
        let ameaoftravel = req.params.amea
        let promises3 = []
        let list3 = []
        var set = new Set()
        interchangeID.forEach(function (id) {
            let urlid = 'http://160.40.52.169:3001/getdtldpoisbyint/' + id + '/' + timeoftravel + '/' + distoftravel + '/' + ameaoftravel + ''
            promises3.push(axios({
                method: 'get',
                url: urlid,
                auth: {
                    username: '*',
                    password: '*'
                }
            }))
        })
        Promise.all(promises3).then(resp => {
            resp.forEach(function (datum) {
                datum['data'].forEach(function (entity) {
                    for (var iii = 0; entity.length; iii++) {
                        if (entity[iii]['id'] == "POIhasID") {
                            if (!set.has(entity[iii]['name'])) {
                                set.add(entity[iii]['name'])
                                //console.log(entity[iii]['name'])
                                list3.push(entity)
                            }
                            break
                        }
                    }
                })
            })
            res.send(list3)
            delete set;
            delete promises3;
            delete list3;
        })
    })

    router.get('/getdtldpoisbyints/:interch/:time/:dist/:amea', (req, res) => {
        let interchangeIDs = req.params.interch
        let interchangeID = interchangeIDs.split(',')
        let timeoftravel = req.params.time
        let distoftravel = req.params.dist
        let ameaoftravel = req.params.amea
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        let promises2 = []
        var list2 = []
        interchangeID.forEach(function (id) {
            let urlid = 'http://160.40.52.169:3001/getdtldpoisbyint/' + id + '/' + timeoftravel + '/' + distoftravel + '/' + ameaoftravel + ''
            promises2.push(axios({
                method: 'get',
                url: urlid,
                auth: {
                    username: '*',
                    password: '*'
                }
            }))
        })
        Promise.all(promises2).then(resp => {
            resp.forEach(function (datum, index) {
                list2.push({ "interchangeID": interchangeID[index], "pois": datum['data'] })
            })
            res.send(list2)
            delete promises2;
            delete list2;
        })
    })

    router.get('/getdtldpoisbyint/:interch/:time/:dist/:amea', (req, res) => {

        let interchangeID = req.params.interch
        let timeoftravel = req.params.time
        let distoftravel = req.params.dist
        let ameaoftravel = req.params.amea
        let url = 'http://160.40.52.169:3001/getpoisbyint/' + interchangeID + '/' + timeoftravel + '/' + distoftravel + '/' + ameaoftravel + ''
        axios({
            method: 'get',
            url: url,
            auth: {
                username: '*',
                password: '*'
            }
        }).then(function (response) {
            let promises = [];
            let list = [];
            response['data']['table'].forEach(function (element) {
                if (element['id'] != "666666" && element['id'] != "55599987778" && element['id'] != "1114477" && element['id'] != "7878787" && element['id'] != "123456,4321,5642") {
                    let urlgetid = 'http://160.40.52.169:3001/getid/"' + element['id'] + '"'
                    promises.push(axios({
                        method: 'get',
                        url: urlgetid,
                        auth: {
                            username: '*',
                            password: '*'
                        }
                    }))
                }
            })
            Promise.all(promises).then(resp => {
                resp.forEach(function (datum) {
                    list.push(datum['data']['table'])
                })
                res.send(list)
                delete promises;
                delete list;
            })
        })
    })

    router.get('/addpoisfromfile', (req, res) => {

        geobject2['features'].forEach(function (element) {
            let poivar = uuidV1();
            if (typeof (element['geometry']['coordinates'][0]) == "object") {
                let tempvar = element['geometry']['coordinates'][0][1]
                element['geometry']['coordinates'][0] = element['geometry']['coordinates'][0][0]
                element['geometry']['coordinates'][1] = tempvar
            };
            element['properties']['name'] = element['properties']['name'].replace(/[^a-zA-Z0-9ά-ωΑ-ώ]/gi, '') + '' + element['id'];
            if (element['properties']['subcategory'] === null) {
                col = +element['properties']['category'][0]
                instoftype = catsubcat[1]['data'][1][col + 1]
            } else {
                col = +element['properties']['subcategory'][0].substring(0, 2);
                row = +element['properties']['subcategory'][0].substring(2, 4);
                instoftype = catsubcat[1]['data'][row + 2][col + 1]
            }
            const readTimeout = 300000;
            const writeTimeout = 300000;
            const repositoryClientConfig = new RepositoryClientConfig(['http://160.40.52.169:7200/repositories/V2'],
                { 'authorization': token.headers.authorization },
                '', readTimeout, writeTimeout);
            const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
            repositoryClient.registerParser(new SparqlJsonResultParser());
            const payload = new UpdateQueryPayload()
                .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
                PREFIX geo: <http://www.opengis.net/ont/geosparql#> \
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
                \
                INSERT DATA { \
                :'+ element['properties']['name'] + ' rdf:type owl:NamedIndividual. \
                :'+ element['properties']['name'] + ' :POIhasID "' + element['id'] + '". \
                :'+ element['properties']['name'] + ' :RoadConnectingJunction "' + element['properties']['interchange_id'].toString() + '". \
                :'+ element['properties']['name'] + ' :isOfHistoricPeriod "' + element['properties']['historic_period'] + '". \
                :'+ element['properties']['name'] + ' :hasNameGr "' + element['properties']['name'] + '". \
                :'+ element['properties']['name'] + ' :hasNameEng "' + element['properties']['name_eng'] + '". \
                :'+ element['properties']['name'] + ' :hasShortDescriptionGr "' + element['properties']['s_descr'] + '". \
                :'+ element['properties']['name'] + ' :hasShortDescriptionEng "' + element['properties']['s_descr_eng'] + '". \
                :'+ element['properties']['name'] + ' :hasFullDescriptionGr "' + element['properties']['full_descr'] + '". \
                :'+ element['properties']['name'] + ' :hasFullDescriptionEng "' + element['properties']['full_descr_eng'] + '". \
                :'+ element['properties']['name'] + ' :belongToRegion "' + element['properties']['periferia'] + '". \
                :'+ element['properties']['name'] + ' :belongsToRegionalUnit "' + element['properties']['per_enotita'] + '". \
                :'+ element['properties']['name'] + ' :belongsToMunicipality "' + element['properties']['dimos'] + '". \
                :'+ element['properties']['name'] + ' :hasAddress "' + element['properties']['address'] + '". \
                :'+ element['properties']['name'] + ' :hasPhoneNumber "' + element['properties']['telephone'] + '". \
                :'+ element['properties']['name'] + ' :hasEmail "' + element['properties']['email'] + '". \
                :'+ element['properties']['name'] + ' :hasWebsite "' + element['properties']['website'] + '". \
                :'+ element['properties']['name'] + ' :hasAverageDurationOfVisit "' + element['properties']['time_spent'] + '". \
                :'+ element['properties']['name'] + ' :hasTicketCost "' + element['properties']['ticket_cost'] + '". \
                :'+ element['properties']['name'] + ' :hasAmeaAccess "' + element['properties']['amea_access'] + '". \
                :'+ element['properties']['name'] + ' :supportsAR "' + element['properties']['is_ar'] + '". \
                :'+ element['properties']['name'] + ' :hasDifficultyLevel "' + element['properties']['difficulty_lvl'] + '". \
                :'+ element['properties']['name'] + ' :hasCategoryOfSource "' + element['properties']['source_cat'] + '". \
                :'+ element['properties']['name'] + ' :isPublished "' + element['properties']['published'] + '". \
                :'+ element['properties']['name'] + ' :isProtected "' + element['properties']['protected'] + '". \
                :'+ element['properties']['name'] + ' :isUnderUnesco "' + element['properties']['unesco'] + '". \
                :'+ element['properties']['name'] + ' :hasWC "' + element['properties']['wc'] + '". \
                :'+ element['properties']['name'] + ' :providesShopping "' + element['properties']['shopping'] + '". \
                :'+ element['properties']['name'] + ' :providesFood "' + element['properties']['food'] + '". \
                :'+ element['properties']['name'] + ' :providesInternalRoutes "' + element['properties']['routes'] + '". \
                :'+ element['properties']['name'] + ' :providesInfoMaterial "' + element['properties']['info_material'] + '". \
                :'+ element['properties']['name'] + ' :hasExhibitionFacility "' + element['properties']['exhibition'] + '". \
                :'+ element['properties']['name'] + ' :hasParkingSlots "' + element['properties']['parking'] + '". \
                :'+ element['properties']['name'] + ' :hasBeenAwarded "' + element['properties']['awards'] + '". \
                :'+ element['properties']['name'] + ' :isCertified "' + element['properties']['certification'] + '". \
                :'+ element['properties']['name'] + ' :providesAccomodation "' + element['properties']['accommodation'] + '". \
                :'+ element['properties']['name'] + ' :providesCatering "' + element['properties']['restaurant'] + '". \
                :'+ element['properties']['name'] + ' :hasRecreationalAreas "' + element['properties']['recreational_areas'] + '". \
                :'+ element['properties']['name'] + ' :hasCulturalFacility "' + element['properties']['cultural'] + '". \
                :'+ element['properties']['name'] + ' :providesShelter "' + element['properties']['refuge'] + '". \
                :'+ element['properties']['name'] + ' :hasObservatories "' + element['properties']['observatories'] + '". \
                :'+ element['properties']['name'] + ' :isSuitableForOutdoorActivities "' + element['properties']['outdoor_activities'] + '". \
                :'+ element['properties']['name'] + ' :isCertifiedOutdoorCompany "' + element['properties']['outdoor_company'] + '". \
                :'+ poivar + ' rdf:type :GPSPoint. \
                :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Point>. \
                :'+ poivar + ' rdf:type <http://www.opengis.net/ont/sf#Geometry>. \
                :'+ poivar + ' rdf:type owl:NamedIndividual. \
                :'+ poivar + ' geo:asWKT \"POINT(' + element['geometry']['coordinates'][0] + ' ' + element['geometry']['coordinates'][1] + ')\"^^geo:wktLiteral. \
                :'+ element['properties']['name'] + ' rdf:type geo:Feature. \
                :'+ element['properties']['name'] + ' geo:hasGeometry :' + poivar + '. \
                :'+ element['properties']['name'] + ' rdf:type :' + instoftype + '. \
                :'+ element['properties']['name'] + ' rdf:type :POI \
                }\
            ')
                .setContentType('application/x-www-form-urlencoded')
                .setInference(true)
                .setTimeout(5);
            return repositoryClient.update(payload).then(() => {
            }).catch(err => console.log(err));
        })
        res.send("insertion of POIs complete")
    })

    router.get('/addinterchanges', (req, res) => {

        interchobject['features'].forEach(function (element) {
            let intervar = uuidV1();
            const readTimeout = 300000;
            const writeTimeout = 300000;
            const repositoryClientConfig = new RepositoryClientConfig(['http://localhost:7200/repositories/V2'],
                { 'authorization': token.headers.authorization },
                '', readTimeout, writeTimeout);
            const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
            repositoryClient.registerParser(new SparqlJsonResultParser());
            const payload = new UpdateQueryPayload()
                .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
                prefix geo: <http://www.opengis.net/ont/geosparql#> \
                INSERT DATA{ \
                \
                :'+ intervar + ' rdf:type :GPSPoint. \
                :'+ intervar + ' rdf:type <http://www.opengis.net/ont/sf#Point>. \
                :'+ intervar + ' rdf:type <http://www.opengis.net/ont/sf#Geometry>. \
                :'+ intervar + ' rdf:type owl:NamedIndividual. \
                :'+ intervar + ' geo:asWKT \"POINT(' + element['geometry']['coordinates'][0] + ' ' + element['geometry']['coordinates'][1] + ')\"^^geo:wktLiteral. \
                \
                :'+ element['properties']['OBJECTID'] + ' rdf:type geo:Feature. \
                :'+ element['properties']['OBJECTID'] + ' rdf:type owl:NamedIndividual. \
                :'+ element['properties']['OBJECTID'] + ' rdf:type :Interchange. \
                :'+ element['properties']['OBJECTID'] + ' geo:hasGeometry :' + intervar + ' \
                \
                }\
            ')
                .setContentType('application/x-www-form-urlencoded')
                .setInference(true)
                .setTimeout(5);
            return repositoryClient.update(payload).then(() => {
            }).catch(err => console.log(err));
        })
        console.log('Ιnsertion of Interchanges complete')
        res.send("insertion of interchanges complete")
    })

    router.get('/getallids', (req, res) => {
        let head = {};
        let table = [];
        head.table = table;
        const readTimeout = 300000;
        const writeTimeout = 300000;
        const repositoryClientConfig = new RepositoryClientConfig(['http://160.40.52.169:7200/repositories/V2'],
            { 'authorization': token.headers.authorization },
            '', readTimeout, writeTimeout);
        const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
        repositoryClient.registerParser(new SparqlJsonResultParser());
        const payload = new GetQueryPayload()
            .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
            select ?POIName (str(?P) as ?POIID) where { \
                \
                ?a :POIhasID ?P \
                BIND(STRAFTER (str(?a), "#") AS ?POIName)}\
            ')
            .setQueryType(QueryType.SELECT)
            .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
            .setLimit(1000);
        return repositoryClient.query(payload).then((stream) => {
            stream.on('data', (bindings) => {
                let test = Object.values(bindings);
                let i = 0;
                test.forEach(function (key, value) {
                    if (i % 2 == 1) {
                        return true;
                    }
                    let element = { id: test[0].id.replace(/['"]+/g, ''), name: test[1].id.replace(/['"]+/g, '') }
                    i++;
                    head.table.push(element);
                });
            });
            stream.on('end', () => {
                res.send(head);
                delete head;
                delete table;
            });
        }).catch(err => console.log(err));
    })

    router.get('/getids/:ids', (req, res) => {

        let arrayIDs = req.params.ids.split(',')
        let promises6 = [];
        let list5 = [];
        arrayIDs.forEach(function (element) {
            urlids = "http://localhost:3001/getid/'" + element.toString() + "'"
            if (element != "666666" && element != "55599987778" && element != "1114477" && element != "7878787" && element != "123456,4321,5642") {
                promises6.push(axios({
                    method: 'get',
                    url: urlids,
                    auth: {
                        username: '*',
                        password: '*'
                    }
                }))
            }
        })
        Promise.all(promises6).then(resp => {
            resp.forEach(function (datum) {
                list5.push(datum['data']['table'])
            })
            res.send(list5)
            delete promises6;
            delete list5;
        })
    })

    router.get('/getid/:id', (req, res) => {

        let params = req.params.id;
        let head = {};
        let table = [];
        head.table = table;
        const readTimeout = 300000;
        const writeTimeout = 300000;
        const repositoryClientConfig = new RepositoryClientConfig(['http://localhost:7200/repositories/V2'],
            { 'authorization': token.headers.authorization },
            '', readTimeout, writeTimeout);
        const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
        repositoryClient.registerParser(new SparqlJsonResultParser());
        const payload = new GetQueryPayload()
            .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  \
            \
            SELECT ?property (str(?v) as ?value) WHERE \
                {{ ?poi :POIhasID '+ params + '. \
                ?poi ?p2 ?v2  \
                FILTER(?p2 in (rdf:type)) \
                BIND(STRAFTER(str(?p2), "#") AS ?property) \
                BIND(STRAFTER(str(?v2), "#") AS ?v) \
                FILTER(?v NOT IN ("Feature","NamedIndividual"))\
                }UNION {\
                {?poi :POIhasID '+ params + '. \
                ?poi ?p2 ?v \
                filter(?p2 not in (rdf:type)) \
                filter isLiteral(?v)\
                } UNION { \
                ?poi :POIhasID '+ params + '. \
                ?poi ?prop2 ?v2. \
                ?v2 ?p2 ?v \
                filter isLiteral(?v)}\
                BIND(STRAFTER(str(?p2), "#") AS ?property)}}\
            ')
            .setQueryType(QueryType.SELECT)
            .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
            .setInference(true)
            .setLimit(100);
        return repositoryClient.query(payload).then((stream) => {
            stream.on('data', (bindings) => {
                let test = Object.values(bindings);
                let i = 0;
                test.forEach(function (key, value) {
                    if (i % 2 == 1) {
                        return true;
                    }
                    let element = { id: test[0].id.replace(/['"]+/g, ''), name: test[1].id.replace(/['"]+/g, '') }
                    i++;
                    head.table.push(element);
                });
            });
            stream.on('end', () => {
                res.send(head);
                delete head;
                delete table;
            });
        }).catch(err => console.log(err));
    });

    router.get('/getpoisbyint/:interch/:time/:dist/:amea', (req, res) => {
        let interchangeID = req.params.interch
        let timeoftravel = parseInt(req.params.time)
        let distoftravel = parseInt(req.params.dist)
        let regexstring = '"^(' + interchangeID + '\\\\D)|(\\\\D' + interchangeID + ')$|(\\\\D' + interchangeID + '\\\\D)"'
        let ameaaccess = req.params.amea
        if (ameaaccess === 'true' || ameaaccess === 'false') {
        } else {
            ameaaccess = '?' + ameaaccess
        }
        let head = {};
        let table = [];
        head.table = table;
        const readTimeout = 300000;
        const writeTimeout = 300000;
        const repositoryClientConfig = new RepositoryClientConfig(['http://160.40.52.169:7200/repositories/V2'],
            { 'authorization': token.headers.authorization },
            '', readTimeout, writeTimeout);
        const repositoryClient = new RDFRepositoryClient(repositoryClientConfig)
        repositoryClient.registerParser(new SparqlJsonResultParser());
        const payload = new GetQueryPayload()
            .setQuery('PREFIX : <http://www.semanticweb.org/evangelos/ontologies/2019/2/untitled-ontology-2#> \
            prefix geo: <http://www.opengis.net/ont/geosparql#>\
            prefix geof: <http://www.opengis.net/def/function/geosparql/>\
            PREFIX uom: <http://www.opengis.net/def/uom/OGC/1.0/>\
            \
            select (str(?id) as ?stringID) ?pname where {\
                ?poiname :RoadConnectingJunction ?interdp.\
    	        filter regex (?interdp, '+ regexstring + ').\
                ?poiname :POIhasID ?id.\
                ?poiname geo:hasGeometry ?y.\
                ?y geo:asWKT ?z.\
                :'+ interchangeID + ' geo:hasGeometry ?intxy.\
                ?intxy geo:asWKT ?intpoint.\
                ?poiname :hasAmeaAccess '+ ameaaccess + '.\
                BIND(STRAFTER(str(?poiname), "#") AS ?pname)\
                BIND ( if ('+ distoftravel + '!=0, geof:distance(?z, ?intpoint, uom:metre), 0) as ?dist).\
                filter (?dist<='+ distoftravel + ').\
                Bind (if ('+ timeoftravel + '!=0 && ' + distoftravel + '!=0, ((?dist*60)/90000), 0) as ?time).\
                filter (?time<='+ timeoftravel + ').\
                Bind (if ('+ timeoftravel + '!=0 && ' + distoftravel + '=0, ((geof:distance(?z, ?intpoint, uom:metre))*60/90000), 0) as ?time2).\
                filter(?time2<='+ timeoftravel + ')\
               \
                }\
                order by asc (?stringID)\
            ')
            .setQueryType(QueryType.SELECT)
            .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
            .setLimit(1000);
        return repositoryClient.query(payload).then((stream) => {
            stream.on('data', (bindings) => {
                let test = Object.values(bindings);
                let i = 0;
                test.forEach(function (key, value) {
                    if (i % 2 == 1) {
                        return true;
                    }
                    let element = { id: test[0].id.replace(/['"]+/g, ''), name: test[1].id.replace(/['"]+/g, '') }
                    i++;
                    head.table.push(element);
                });
            });
            stream.on('end', () => {
                res.send(head);
                delete head;
                delete table;
                head.table = table;
            });
        }).catch(err => console.log(err));
    })

    router.get('/hi', (req, res) => {
        res.send('hi \\n asd')
    });
});

router.use((req, res, next) => {
    console.log("Called: ", req.path)
    next();
});

module.exports = router;
