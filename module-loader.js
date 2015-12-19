(function(root){
	var doc = root.document,
		modules = {},
		listeners = {},
		defaultCfg = {
			loadPath:"/",
			mapping : {}
		},
		Event = {
			emit : function(type,arg){
				setTimeout(function(){
					var lstrs = (listeners[type]||[]);
					while(lstrs.length){
						var listener=lstrs.shift();
						listener.cb.call(listener.cxt,arg,type);
					}
					delete listeners[type];
				},0)
			},
			on : function(type,cxt,cb){
				(listeners[type]||(listeners[type]=[])).push({
					cxt:cxt,
					cb:cb
				});
			}
		}

	var Module = function(mName,deps,cb){
		this.mName=mName;
		this.waitDeps=deps&&deps.length||0;
		this.deps = deps;
		this.cb = cb;
		this.loaded = false;
	}
	Module.prototype = {
		__export : function(){
			return this.export||this.cb.apply(this,this.deps.map(function(mName){
				return modules[mName].export||modules[mName].__export();
			}));
		},
		__update : function(){
			if(!(--this.waitDeps)){
				this.loaded = true;
				this.exec?(this.export||this.__export()):Event.emit(this.mName);	
			}
		}
	}
	
	function __define(name,deps,cb,exec){

		var mNode = document.currentScript,
			mName = mNode.getAttribute("data-module-name")||name,
			module;
		module = exec?new Module(mName,deps,cb):(modules[mName]||new Module(mName,deps,cb));
		module.cb=cb;
		module.deps=deps;
		module.waitDeps=deps.length;
		module.exec=exec;
		module.path=mNode.src;
		name&&(modules[name]=module);
		__loadDeps(module,deps);	
	}
	function __loadDeps(module,deps){
		if(!deps.length)module.loaded=true;
		deps.forEach(function(mName){
			var depModule = modules[mName];
			if(!depModule){
				__createScriptNode(mName);
				Event.on(mName,module,module.__update);
			}
			else if(depModule.loaded){module.__update()};
		});
	}
	function __createScriptNode(mName){
		var mNode = doc.createElement("script");
		mNode.src=defaultCfg.mapping[mName]||(mName+".js");
		mNode.setAttribute("data-module-name",mName);
		var module = new Module(mName);
		modules[mName] = module;
		mNode.onload=function(){
			!module.waitDeps&&Event.emit(mName);
		}
		doc.body.appendChild(mNode);
		return module;
	}
	// ********************************************************************
	var define = function(mName,deps,cb){
		var args = arguments.length;
		if(args===2){
			cb=deps;
			deps = (typeof mName==="string")?[]:mName;
			mName = (typeof mName==="string")?mName:null;
		}
		__define(mName ,deps,cb);
	}
	var require = function(deps,cb){
		__define(null,(typeof deps==="string")?[deps]:deps,cb,true);
	}
	require.config = function(cfg){
		cfg||(cfg={});
		for(var k in cfg){
			defaultCfg[k]=cfg[k];
		}
		return defaultCfg;
	}
	root.define=define;
	root.require=require;
})(this);