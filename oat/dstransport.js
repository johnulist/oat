/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2014 OpenLink Software
 *
 *  See LICENSE file for details.
 */

OAT.DSTransport = {};

OAT.DSTransport.SQL = {
        cur_query : null,
        _cat: "",
        _sch: "",
        _tbl: "",
        keys: [],
        quadData: {},
        _useDereference: false,
        _isSparql:  false,
        _isQuadData: false,

	fetch:function(conn,options,index,callback) {
		this._useDereference = conn.options.useDereference
		this._isQuadData = false;
		this._isSparql = false;
		OAT.Xmla.connection = conn;
		if (options.query.indexOf("!~!",0)==0) {
		  OAT.Xmla.query = options.query.substr(3);
		  this._isQuadData = true;
		  _isQuadData = true;
		} else {
		  OAT.Xmla.query = options.query;
		}

		this._isSparql = this.isSPARQL(OAT.Xmla.query);

		var l = (options.cursortype == 1 ? options.limit : 0);
		var tblLst = null;
		
		if (conn.options.useDereference)
		  tblLst = this.parseSQL(OAT.Xmla.query);
		
		if (tblLst != null && tblLst.length==1) {
	          var tbl = tblLst[0].split(".");
	          _cat = (tbl.length>2?tbl[tbl.length-3]:""); 
                  _sch = (tbl.length>1?tbl[tbl.length-2]:""); 
                  _tbl = tbl[tbl.length-1];
                  keys = [];
	        
	          var cBack = function(rs) {

                    var pkeyBack = function(data) {
                      for(var i=0; i<data.length; i++)
                      {
                        keys.push({
                          ind: "p",
                          cat: _cat,
                          sch: _sch,
                         ptbl: _tbl,
                         pcol: data[i],
                         ftbl: "",
                         fcol: "",
                         fseq: i });
                      }

                      var fkeyBack = function(data) {
                        for(var i=0; i<data.length; i++)
                        {
                          row = data[i];
                          keys.push({
                            ind: "f",
                            cat: row[0].catalog,
                            sch: row[0].schema,
                           ptbl: row[0].table,
                           pcol: row[0].column,
                           ftbl: row[1].table,
                           fcol: row[1].column,
                           fseq: i });
                        }


                        var rkeyBack = function(data) {
                          for(var i=0; i<data.length; i++)
                          {
                            row = data[i];
                            keys.push({
                              ind: "r",
                              cat: row[0].catalog,
                              sch: row[0].schema,
                             ptbl: row[1].table,
                             pcol: row[1].column,
                             ftbl: row[0].table,
                             fcol: row[0].column,
                             fseq: i });
                          }
                          options._keys = keys;
                          options._cat = _cat;
                          options._sch = _sch;
                          options._tbl = _tbl;
                          callback(rs);
                        };

                        OAT.Xmla.referenceKeys(_cat,_sch,_tbl, rkeyBack);
                      };

                      OAT.Xmla.foreignKeys(_cat,_sch,_tbl, fkeyBack);
                    };

	            OAT.Xmla.primaryKeys(_cat,_sch,_tbl,pkeyBack);
	          };
		
		  OAT.Xmla.execute(cBack,{limit:l,offset:index});
		} else {
		  OAT.Xmla.execute(callback,{limit:l,offset:index});
                }
	},
	parse:function(fetchedData,options,outputFields) {
	        if (this._isQuadData) {
	          var rows = fetchedData[1];
                  var max_id_len = (""+rows.length).length;
                  var id_pref = "0000000000";
                  this.quadData = {};
	          for(var i=0; i < rows.length; i++) {
	            var data= rows[i];
	            var q= {};
	            q.tbl = data[0].split("#")[0];
	            q.cname = data[1];
	            q.cval = data[2];
	            q.k_type = data[3];
	            q.main_tbl = data[4];
	            q.k_size = data[5];
	            var j=6;
	            q.key = [];
	            q.k_val = [];
	            for(var x=0; x< q.k_size; x++)
	              q.key.push(data[j+x]);
	            j += parseInt(q.k_size);
	            for(var x=0; x< q.k_size; x++)
	              q.k_val.push(data[j+x]);
	            var val = ""+i;
                    val = (id_pref+val).substr(id_pref.length - max_id_len+val.length);
                    this.quadData["r"+val] = q;
	          }
	          var outCols = ["ObjectID","Attribute","Value","TableName"];
	          var outData = [];
	          for (var x in this.quadData) {
	            var q = this.quadData[x];
	            var id = x.substr(1);
	            var key_id = "";
	            var key_val = "";
	            for (var i=0; i < q.k_size; i++) {
	              if (i>0) {key_id +="&"; key_val += "&";}
	              key_id += q.key[i];
	              key_val += q.k_val[i];
	            }
	              // 1 - HTTP link  
	              // 2 - HTTP sparql link  
	              // 3 - greenLink
	              // 4 - greenLinkQuad

	            var objid = {value:q.tbl+"."+key_val+"#this", valueType:4, colName:id+"#0"};
	            var attr  = {value:q.cname, valueType:4, colName:id+"#1"};
	            var value;
                    if (q.k_type != 0) {
                      if (q.k_type & 8)
                        value = {value:q.main_tbl+"."+q.cval+"#this", valueType:4, colName:id+"#2"};
                      else if (q.k_type & 4)
                        value = {value:q.tbl+"."+key_val+"#self", valueType:4, colName:id+"#2"};
                      else if (q.k_type & 1)
                        value = {value:q.tbl+"."+key_val+"#"+q.cval, valueType:4, colName:id+"#2"};
                      else
                        value = {value:q.tbl+"."+q.cname+"#"+q.cval, valueType:4, colName:id+"#2"};
                    } else {
                       var v=q.cval;
	               if (v.indexOf("http://")==0 || v.indexOf("https://")==0)
	                 value = {value:v, valueType:1 };
	               else
                         value = v;
                    }
                    var table = {value:q.tbl, valueType:4, colName:id+"#3"};

	            outData.push([
	            	objid,
	            	attr,
	            	value,
	            	table
	                ]);
	          }
	          options._quadData = this.quadData;
	          return [outCols, outData];

	        } else if (keys!=null) {

	          var fkey=[];
		  var colNames = fetchedData[0];
		  for(var i=0; i < colNames.length; i++) {
		    fkey[i]=false;
		    var colname = colNames[i];
		    for(var j=0; j<keys.length; j++)
		      if (colname == keys[j].pcol)
		      {
		        fkey[i]=true;
		        break;  
		      }
		  }

		  var rows = fetchedData[1];
		  for(var i=0; i<rows.length; i++) {
		    var cols = rows[i];
		    for(var j=0; j<cols.length; j++) {
	              // 1 - HTTP link  
	              // 2 - HTTP sparql link  
	              // 3 - greenLink
	              // 4 - greenLinkQuad
		      if (fkey[j])
		        cols[j] = {value:cols[j], valueType:3, colName:colNames[j]};
		    }
		  }

		} else if (this._useDereference && fetchedData[1].length >0) {
	      
	          var rows = fetchedData[1];
	          for(var i =0; i < rows.length; i++) {
	            var data = rows[i];
	            for(var j=0; j < data.length; j++) {
	              var col_val = data[j];
	              if (col_val.indexOf("http://")==0 || col_val.indexOf("https://")==0)
	              { 
	                // 1 - HTTP link  
	                // 2 - HTTP sparql link  
	                // 3 - greenLink
	                // 4 - greenLinkQuad
	                data[j] = {value:col_val, 
	                          valueType:this._isSparql?2:1
	                         };
	              }
	            }
	          }
	        }
		return fetchedData;
	},
	options:{
		query:"", /* query text */
		table:"", /* table name; it is up to user to create appropriate query for table */
		limit:50, /* for cursors */
		cursortype:1 /* 0 - Snapshot, 1 - Dynaset */
	},
        parseSQL:function(query) {
   		var sqlQuery = query.replace(/\n/g, ' ').replace(/\r/g, '');

   		var startWith = function(str, findStr) {return (str.match("^"+findStr)==findStr);};
		var ltrim = function(str) { return str.replace(/^\s+/,"");};

//   		var query_type = sqlQuery.split(/\s+/)[0];
//   		if (query_type.toUpperCase() != 'SELECT')
   		if (!startWith(ltrim(sqlQuery).toUpperCase(), 'SELECT'))
     		    return null;

   		var strip_quotes = function(str) {
      		    return str.replace(/\"/g, '').replace(/\'/g, '').replace(/\[/g, '').replace(/\]/g, '');
   		}

   		var strip_whitespace = function(str) {
      		    return str.replace(/\s+/g, '');
   		}

   		var findClause = function(str, regexp) {
      		    var clauseEnd = str.search(regexp);
      		    if (clauseEnd < 0)
          		clauseEnd = str.length;
      		    return str.substring(0, clauseEnd);
   		}

   		var fromSplit = sqlQuery.substring(7).split(new RegExp(" FROM ","i"));
   		if (fromSplit.length != 2)
      		    return null;
            
   		var columnsClause = fromSplit[0];
   		var remaining     = fromSplit[1];

   		var fromClause    = findClause(remaining, /\sWHERE\s|\sGROUP BY\s|\sHAVING\s|\sORDER BY\s|\sLIMIT/i);
   		var fromTableClause = findClause(fromClause, /\sLEFT OUTER JOIN\s/i);

   		var fromTables = strip_whitespace(fromTableClause).split(',');
   		remaining = remaining.substring(fromClause.length);
            
   		var fromClauseSplit = fromClause.split(new RegExp(" LEFT OUTER JOIN ","i"));
   		var fromClauseParts = [fromClauseSplit[0]];
   
   		var leftJoinComponents;
   		for (var i = 1; i < fromClauseSplit.length; i++) {
      		    leftJoinComponents = /(\w+)\sON\s(.+)/i.exec(fromClauseSplit[i]);
      		    fromTables.push(leftJoinComponents[1]);
   		}

//   		if(strip_whitespace(columnsClause) == '*') {
//       	    var new_columns = [];
//       	    for(var i=0; i<fromTables.length; i++) {
//          		new_columns.push(fromTables[i]+'.ALL')
//       	    }
//       	    columnsClause = columnsClause.replace(/\*/, new_columns.join(', '))
//   		}

   		for(var i=0; i < fromTables.length; i++)
     		    fromTables[i] = strip_quotes(fromTables[i]);

   		return fromTables;
	},
	isSPARQL: function(sql) {
                var sQuery = sql.replace(/\n/g, ' ').replace(/\r/g, '');
                var query_type = sQuery.split(/\s+/)[0];
                if (query_type.toUpperCase() != 'SPARQL')
                  return false;
                else
                  return true;
        }

}

OAT.DSTransport.WSDL = {
	fetch:function(conn,options,index,callback) {
		OAT.WS.invoke(conn.options.url,options.service,callback,options.inputObj);
	},
	parse:function(fetchedData,options,outputFields) {
		var allValues = {};
		var data = [];
		/* analyze maximum count */
		var max = 0;
		for (var i=0;i<outputFields.length;i++) {
			var name = outputFields[i];
			/* find number of appearances of this output field in output object */
			var values = OAT.JSObj.getAllValues(fetchedData,name);
			allValues[name] = values;
			var l = values.length;
			if (l > max) { max = l; }
		}
		for (var i=0;i<max;i++) {
			var row = [];
			for (var j=0;j<outputFields.length;j++) {
				var name = outputFields[j];
				var values = allValues[name];
				var v = (values.length ? values[i % values.length] : "");
				row.push(v);
			}
			data.push(row);
		}
		return [outputFields,data];
	},
	options:{
		service:"", /* name of wsdl service */
		rootelement:"", /* name of root input wsdl element */
		inputobj:false
	}
}

OAT.DSTransport.REST = {
	fetch:function(conn,options,index,callback) {
		OAT.AJAX.GET(conn.options.url,options.query,callback);
	},

	parse:function(fetchedData,options,outputFields) {
		var obj = {};
		var nsObj = {};
		var xmlDoc = false;
		if (options.output == 0) { /* xml */
			/* analyze namespaces */
			var ns = fetchedData.match(/xmlns="([^"]*)"/);
			if (ns) { nsObj[" "] = ns[1]; }
			var ns = fetchedData.match(/xmlns:[^=]+="[^"]*"/g);
			if (ns) for (var i=0;i<ns.length;i++) {
				var tmp = ns[i];
				var r = tmp.match(/xmlns:([^=]+)="([^"]*)"/);
				nsObj[r[1]] = r[2];
			}
			/* BAD HACK FOR GECKO - remove default namespace - THIS IS WRONG AND UGLY!!! */
			var t = fetchedData.replace(/xmlns="[^"]*"/g,"");
			/***/
			xmlDoc = OAT.Xml.createXmlDoc(t);
			obj = OAT.JSObj.createFromXmlNode(xmlDoc.documentElement);
		} else { /* json */
			obj = OAT.JSON.deserialize(text);
		}
		
		var allValues = {};
		var data = [];
		/* analyze maximum count */
		var max = 0;
		for (var i=0;i<outputFields.length;i++) {
			var name = outputFields[i];
			/* find number of appearances of this output field in output object */
			if (options.xpath) { /* makes sense only for non-JSON data */
				var nodes = OAT.Xml.xpath(xmlDoc,name,nsObj);
				var values = [];
				for (var j=0;j<nodes.length;j++) { values.push(OAT.Xml.textValue(nodes[j])); }
			} else {
				var values = OAT.JSObj.getAllValues(obj,name);
			}
			allValues[name] = values;
			var l = values.length;
			if (l > max) { max = l; }
		}
		for (var i=0;i<max;i++) {
			var row = [];
			for (var j=0;j<outputFields.length;j++) {
				var name = outputFields[j];
				var values = allValues[name];
				var v = (values.length ? values[i % values.length] : "");
				row.push(v);
			}
			data.push(row);
		}
		return [outputFields,data];
	},

	options:{
		query:"", /* querystring */
		output:0, /* 0 = xml, 1 = json */
		xpath:0 /* use xpath for output names? */
	}
}
