/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Palette(obj) {
	var self = this;
	this.win = new OAT.Window({min:0,max:0,close:1,width:160,height:0,x:-15,y:20,title:"Controls Palette"});
	this.win.hide = function() {OAT.Dom.hide(self.win.div);};
	this.win.show = function() {OAT.Dom.show(self.win.div);};
	this.win.onclose = function() {
		self.win.hide();
		tbar.icons[0].toggle();
	}
	this.items = [];
	
	this.addObject = function(type) { 
		var div = OAT.Dom.create("div",{cursor:"pointer"});
		div.innerHTML = OAT.FormObjectNames[type];
		self.win.content.appendChild(div);
		self.items.push([div,type]);
	}
	
	this.getAddRef = function(index) {
		return function(target,x,y) {
			var type = self.items[index][1];
			var o = obj.addObject(type,x,y);
			if (o.userSet) { o.setValue(type); }
			obj.toolbox.showObject(o);
		}
	}
	
	this.createDrags = function() {
		for (var i=0;i<self.items.length;i++) {
			obj.gd.addSource(self.items[i][0],function(elm){ elm.style.fontWeight="bold";elm.style.zIndex = 10;},self.getAddRef(i));
		}
	} /* Palette::createDrags() */
}
