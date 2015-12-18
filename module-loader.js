(function(root){
	var doc = root.document,
		modules = {},
		listeners = {},
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
	
	function __define(deps,cb,exec){
		var mNode = document.currentScript,
			mName = mNode.getAttribute("data-module-name");
		var module = exec?new Module(null,deps,cb):modules[mName];
		module.cb=cb;
		module.deps=deps;
		module.waitDeps=deps.length;
		module.exec=exec;
		__loadDeps(module,deps);	
	}
	function __loadDeps(module,deps){
		deps.forEach(function(mName){
			if(!modules[mName]){
				__createScriptNode(mName);
				Event.on(mName,module,module.__update);
			}
			else if(modules[mName].status){module.__update()};
		});
	}
	function __createScriptNode(mName){
		var mNode = doc.createElement("script");
		mNode.src=mName+".js";
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
	var define = function(deps,cb){
		__define(deps,cb);
	}
	var require = function(deps,cb){
		__define(deps,cb,true);
	}
	root.define=define;
	root.require=require;
})(this);