/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	new OAT.Tab(element)
	Tab.add(clicker,window)
	Tab.go(index)
	Tab.remove(clicker);
	
	CSS: .tab, .tab_selected
*/

OAT.Tab = function(elm) {
	this.keys = [];
	this.values = [];
	this.element = $(elm);
	this.div = this.element;
	this.selectedIndex = -1;
	this.goCallback = function(oldIndex,newIndex){};
	
	this.add = function(elm_1,elm_2) {
		var element_1 = $(elm_1);
		var element_2 = $(elm_2);
		OAT.Dom.addClass(element_1,"tab");
		var index = this.keys.length;
		
		this.keys.push(element_1);
		this.values.push(element_2);
		var obj = this;
		var ref=function() {
			obj.go(index);
		}
		OAT.Dom.attach(element_1,"click",ref);
		this.go(index);
	};

	this.clear = function() {
		if (this.selectedIndex != -1) {
			OAT.Dom.hide(this.values[this.selectedIndex]);
			document.body.appendChild(this.values[this.selectedIndex]);
			OAT.Dom.removeClass(this.keys[this.selectedIndex],"tab_selected");
		}
	};

	this.go = function(index) {
		this.clear();
		this.element.appendChild(this.values[index]);
		OAT.Dom.show(this.values[index]);
		OAT.Dom.addClass(this.keys[index],"tab_selected");
		this.goCallback(this.selectedIndex,index);
		this.selectedIndex = index;
	};
	
	this.remove = function(element) {
		var elm = $(element);
		var decreaseIndex = false;
		var index = this.keys.find(elm);
		if (index < this.selectedIndex) { decreaseIndex = true; }
		if (index == this.selectedIndex) {
			decreaseIndex = true;
			if (index == this.keys.length-1) {
				this.go(index-1);
				decreaseIndex = false;
			} else {
				this.go(index+1);
			}
		}
		this.keys.splice(index,1);
		this.values.splice(index,1);
		if (decreaseIndex) { this.selectedIndex--; }
	};
	
	OAT.Dom.clear(this.element); 
}
OAT.Loader.featureLoaded("tab");
