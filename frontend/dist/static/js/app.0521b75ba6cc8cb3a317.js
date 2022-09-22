webpackJsonp([1],{NHnr:function(t,e,s){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var a=s("7+uW"),n={render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{attrs:{id:"app"}},[e("router-view")],1)},staticRenderFns:[]};var i=s("VU/8")({name:"app"},n,!1,function(t){s("Wghp")},null,null).exports,r=s("/ocq"),d=s("mtWM"),o=s.n(d),p="http://127.0.0.1:5200",u={name:"Recorder",data:function(){return{input:{person:{firstname:"",lastname:""},address:{city:"",state:""},addressid:""},people:[],addresses:[]}},mounted:function(){var t=this;o()({method:"GET",url:p+"/people"}).then(function(e){t.people=e.data||[]}).catch(function(){t.people=[]}),o()({method:"GET",url:p+"/addresses"}).then(function(e){t.addresses=e.data||[]}).catch(function(){t.addresses=[]})},methods:{createPerson:function(){var t=this;""!==this.input.person.firstname&&""!==this.input.person.lastname&&o()({method:"POST",url:p+"/person",data:this.input.person,headers:{"content-type":"application/json"}}).then(function(e){t.people||(t.people=[]),t.people.push(e.data),t.input.person.firstname="",t.input.person.lastname=""}).catch(function(){})},createAddress:function(){var t=this;""!==this.input.address.city&&""!==this.input.address.state&&o()({method:"POST",url:p+"/address",data:this.input.address,headers:{"content-type":"application/json"}}).then(function(e){t.addresses||(t.addresses=[]),t.addresses.push(e.data),t.input.address.city="",t.input.address.state=""}).catch(function(){})},linkAddress:function(t){var e=this;void 0!==this.input.addressid&&""!==t&&o()({method:"PUT",url:p+"/person/address/"+t,data:{addressid:this.input.addressid},headers:{"content-type":"application/json"}}).then(function(s){for(var a=function(s){e.people[s].id===t&&(void 0===e.people[s].addresses&&(e.people[s].addresses=[]),o()({method:"GET",url:p+"/address/"+e.input.addressid}).then(function(t){e.people[s].addresses.push(t.data),e.input.addressid=""}).catch(function(){}))},n=0;n<e.people.length;n++)a(n)})}}},c={render:function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("div",{attrs:{id:"recorder"}},[s("div",{staticClass:"container"},[s("div",{staticClass:"row"},[s("div",{staticClass:"col-md-6"},[s("div",{staticClass:"well"},[s("form",[s("div",{staticClass:"form-group"},[s("label",{attrs:{for:"firstname"}},[t._v("First Name")]),t._v(" "),s("input",{directives:[{name:"model",rawName:"v-model",value:t.input.person.firstname,expression:"input.person.firstname"}],staticClass:"form-control",attrs:{type:"text",id:"firstname",placeholder:"First Name"},domProps:{value:t.input.person.firstname},on:{input:function(e){e.target.composing||t.$set(t.input.person,"firstname",e.target.value)}}})]),t._v(" "),s("div",{staticClass:"form-group"},[s("label",{attrs:{for:"lastname"}},[t._v("Last Name")]),t._v(" "),s("input",{directives:[{name:"model",rawName:"v-model",value:t.input.person.lastname,expression:"input.person.lastname"}],staticClass:"form-control",attrs:{type:"text",id:"lastname",placeholder:"Last Name"},domProps:{value:t.input.person.lastname},on:{input:function(e){e.target.composing||t.$set(t.input.person,"lastname",e.target.value)}}})]),t._v(" "),s("button",{staticClass:"btn btn-default",attrs:{type:"button"},on:{click:function(e){return t.createPerson()}}},[t._v("Save")])])])]),t._v(" "),s("div",{staticClass:"col-md-6"},[s("div",{staticClass:"well"},[s("form",[s("div",{staticClass:"form-group"},[s("label",{attrs:{for:"city"}},[t._v("City")]),t._v(" "),s("input",{directives:[{name:"model",rawName:"v-model",value:t.input.address.city,expression:"input.address.city"}],staticClass:"form-control",attrs:{type:"text",id:"city",placeholder:"City"},domProps:{value:t.input.address.city},on:{input:function(e){e.target.composing||t.$set(t.input.address,"city",e.target.value)}}})]),t._v(" "),s("div",{staticClass:"form-group"},[s("label",{attrs:{for:"state"}},[t._v("State")]),t._v(" "),s("input",{directives:[{name:"model",rawName:"v-model",value:t.input.address.state,expression:"input.address.state"}],staticClass:"form-control",attrs:{type:"text",id:"state",placeholder:"State"},domProps:{value:t.input.address.state},on:{input:function(e){e.target.composing||t.$set(t.input.address,"state",e.target.value)}}})]),t._v(" "),s("button",{staticClass:"btn btn-default",attrs:{type:"button"},on:{click:function(e){return t.createAddress()}}},[t._v("Save")])])])])]),t._v(" "),s("div",{staticClass:"row"},[s("div",{staticClass:"col-md-12"},[s("ul",{staticClass:"list-group"},t._l(t.people,function(e){return s("li",{key:e.id,staticClass:"list-group-item"},[t._v("\n                        "+t._s(e.firstname)+" "+t._s(e.lastname)+" -\n                        "),t._l(e.addresses,function(e){return s("span",{key:e.id},[t._v("\n                            "+t._s(e.city)+", "+t._s(e.state)+" /\n                        ")])}),t._v(" "),s("div",[s("form",[t._l(t.addresses,function(e){return s("div",{key:e.id},[s("input",{directives:[{name:"model",rawName:"v-model",value:t.input.addressid,expression:"input.addressid"}],attrs:{type:"radio",name:"addressid"},domProps:{value:e.id,checked:t._q(t.input.addressid,e.id)},on:{change:function(s){return t.$set(t.input,"addressid",e.id)}}}),t._v(" "+t._s(e.city)+", "+t._s(e.state)+"\n                                ")])}),t._v(" "),s("button",{staticClass:"btn btn-default",attrs:{type:"button"},on:{click:function(s){return t.linkAddress(e.id)}}},[t._v("Save")])],2)])],2)}),0)])])])])},staticRenderFns:[]};var l=s("VU/8")(u,c,!1,function(t){s("QRIJ")},"data-v-1929c42f",null).exports;a.a.use(r.a);var m=new r.a({routes:[{path:"/",name:"Recorder",component:l}]});a.a.config.productionTip=!1,new a.a({el:"#app",router:m,components:{App:i},template:"<App/>"})},QRIJ:function(t,e){},Wghp:function(t,e){}},["NHnr"]);
//# sourceMappingURL=app.0521b75ba6cc8cb3a317.js.map