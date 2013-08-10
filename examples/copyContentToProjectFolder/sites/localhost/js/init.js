global.onLoad(function() {

	$('body').addClass('js');
	$.fixCookie("SID");

	global.disableContextMenu();
	global.disableCopy();
	global.disableSelection();

	panelLeft = $('#panel-left');
	panelCenter = $('#panel-center');
	panelRight = $('#panel-right');

	// -------------------

	//setTimeout(sseConnect, 1000);

	function sseConnect() {
		var sse = new EventSource("/api/examples/test.sse");
		var sseListener = function (event) {
			var div = document.createElement("div");
			var type = event.type;
			div.appendChild(document.createTextNode(type + ": " + (type === "message" ? event.data : sse.url)));
			id("panel-center").appendChild(div);
		};
		sse.addEventListener("open", function(e) {
			console.log("open: sse.readyState="+sse.readyState);
		}, false);
		sse.addEventListener("ping", function(e) {
			console.log("ping: type="+e.type+", data="+e.data);
		}, false);
		sse.addEventListener("error", function(e) {
			//setTimeout(sseConnect, 3000);
			console.log("error: sse.readyState="+sse.readyState);
		}, false);
	}

	// --- Auth Module ---

	$('#hmenu-Signin').click(function() {
		$('#formLogin').togglePopup();
		return false;
	});

	$('#hmenu-Signout').click(function() {
		$.post('/api/auth/signOut.json', {}, function(data) {
			if (localStorage) localStorage.clear();
			window.location.reload(true);
		}, "json");
		return false;
	});

	$('#hmenu-Register').click(function() {
		$('#formReg').togglePopup();
		return false;
	});

	$(document).on('click', '#formRegDo', function(event) {
		var inputEmail = $('#formRegEmail'),
			inputPassword = $('#formRegPassword'),
			RegValidation = null,
			Data = { "Email": inputEmail.val() };
		$.ajax({
			url: '/api/auth/regvalidation.json',
			type: 'POST',
			dataType: 'json',
			async: false,
			data: Data,
			success: function(json) { RegValidation = json; }
		});
		if (RegValidation!=null) {
			Data.Password = inputPassword.val();
			if (!RegValidation.Email) inputEmail.addClass('invalid').focus(); else inputEmail.removeClass('invalid');
			$.post("/api/auth/register.json", Data, function(data) {
				if (data.Result=='Ok') window.location.reload(true);
			}, "json");
		}
		return false;
	});

	$(document).on('click', '#formLoginSignIn', function() {
		$('#formLoginSubmit').click();
	});

	// --- LEFT MENU ---

	$(document).on('click', '#menuDBMI', function() {
		panelLeft.html('<div id="dbmiTree" class="tree"></div>');
		initTree();
	});

	/*
	$(document).on('click', '#menuAJAX'
	$(document).on('click', '#menuJSON'
	$(document).on('click', '#menuTemplate'
	$(document).on('click', '#menuFileUpload'
	$(document).on('click', '#menuDownload'
	$(document).on('click', '#menuGeoIP'
	$(document).on('click', '#menuSSE'
	$(document).on('click', '#menuSendMail'
	*/

	var metadata = {
		plugins: [
			"themes","json_data","ui","crrm",/*"cookies",*/"dnd","search","types","hotkeys","contextmenu" 
		],
		json_data: {
			ajax: {
				url: "/dbmi/tree/data.json",
				// the `data` function is executed in the instance's scope
				// the parameter is the node being loaded 
				// (may be -1, 0, or undefined when loading the root nodes)
				data: function (n) {
					setTimeout(function () { panelLeft.resize(); }, 2000);
					// the result is fed to the AJAX request `data` option
					return { id: n.attr ? n.attr("id") : 1 };
				}
			}
		},
		search: {
			// As this has been a common question - async search
			// Same as above - the `ajax` config option is actually jQuery's AJAX object
			ajax: {
				url: "/dbmi/tree/search.json",
				data: function (str) { // You get the search string as a parameter
					return { search_str: str };
				}
			}
		},
		types: {
			// I set both options to -2, as I do not need depth and children count checking
			// Those two checks may slow jstree a lot, so use only when needed
			max_depth: -2,
			max_children: -2,
			// I want only `drive` nodes to be root nodes 
			// This will prevent moving or creating any other type as a root node
			valid_children: [ "root" ],
			types: {
				default: {
					// valid_children: "none",
					valid_children: [ "default", "provider", "database", "collection", "disk", "folder", "file", "table", "view" ],
					icon: {
						image: "/js/jstree/images/folder.png"
					},
					select_node: function(e) {
						var element = e[0];
						if (element) {
							displayData(element.id);
						}
						this.toggle_node(e);
						return true;
					}
				},
				folder: {
					valid_children: "none",
					icon: {
						image: "/js/jstree/images/folder.png"
					},
				},
				provider: {
					valid_children: [ "database" ],
					icon: {
						image: "/js/jstree/images/provider.png"
					},
				},
				database: {
					valid_children: [ "table", "view", "collection" ],
					icon: {
						image: "/js/jstree/images/database.png"
					},
				},
				collection: {
					valid_children: "none",
					icon: {
						image: "/js/jstree/images/collection.png"
					},
				},
				table: {
					valid_children: "none",
					icon: {
						image: "/js/jstree/images/table.png"
					},
				},
				view: {
					valid_children: "none",
					icon: {
						image: "/js/jstree/images/view.png"
					},
				},
				folder: {
					valid_children: "none",
					icon: {
						image: "/js/jstree/images/folder.png"
					},
				},
				root: {
					valid_children: [ "default", "provider", "database" ],
					icon: {
						image: "/js/jstree/images/provider.png"
					},
					start_drag:  false,
					move_node:   false,
					delete_node: false,
					remove:      false
				}
			}
		},
		ui: {
			// "initially_select" : [ "root" ]
		},
		core: { 
			// "initially_open" : [ "objects" ] 
		},
		contextmenu: {
			items: customMenu
		}
	};

	function initTree() {
		$("#dbmiTree")
		.bind("before.jstree", function (e, data) {
			$("#alog").append(data.func + "<br />");
		})
		.jstree(metadata)
		.bind("create.jstree", function (e, data) {
			$.post("/dbmi/tree/create.json", {
				id:       data.rslt.parent.attr("id"),
				position: data.rslt.position,
				title:    data.rslt.name,
				type:     data.rslt.obj.attr("rel")
			}, function (res) {
				if (res.status) $(data.rslt.obj).attr("id", res.id);
				else $.jstree.rollback(data.rlbk);
			});
		})
		.bind("remove.jstree", function (e, data) {
			data.rslt.obj.each(function () {
				var id = this.id;
				confirmation('Удалить раздел','Хотите ли Вы удалить раздел?', function() {
					$.ajax({
						async: false,
						type:  'POST',
						url:   "/dbmi/tree/delete.json",
						data:  { id: id },
						success: function (res) {
							if (!res.status) data.inst.refresh();
						}
					});
				});
			});
		})
		.bind("rename.jstree", function (e, data) {
			$.post("/dbmi/tree/rename.json", {
				id:    data.rslt.obj.attr("id"),
				title: data.rslt.new_name
			}, function (res) {
				if (!res.status) $.jstree.rollback(data.rlbk);
			});
		})
		.bind("move_node.jstree", function (e, data) {
			data.rslt.o.each(function(i) {
				$.ajax({
					async: false,
					type:  'POST',
					url:   "/dbmi/tree/move.json",
					data:  {
						id:       $(this).attr("id"),
						ref:      data.rslt.cr === -1 ? 1 : data.rslt.np.attr("id"),
						position: data.rslt.cp + i,
						title:    data.rslt.name,
						copy:     data.rslt.cy ? 1 : 0
					},
					success: function (res) {
						if (!res.status) {
							$.jstree.rollback(data.rlbk);
						} else {
							$(data.rslt.oc).attr("id", res.id);
							if (data.rslt.cy && $(data.rslt.oc).children("UL").length) {
								data.inst.refresh(data.inst._get_parent(data.rslt.oc));
							}
						}
					}
				});
			});
		})
		.bind("loaded.jstree", function (event, data) {
			$("#dbmiTree").jstree('select_node', 'ul > li:first');
		});
	}

	function customMenu(node) {
		var items = {
			"create" : {
				"separator_before"	: false,
				"separator_after"	: false,
				"label"				: "Создать",
				"action"			: false,
				"icon"				: "/js/jstree/images/create.png",
				"submenu" : { 
					"afolder" : {
						"separator_before"	: false,
						"separator_after"	: false,
						"label"				: "Раздел",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "folder" } }); },
						"icon"				: "/js/jstree/images/folder.png"
					},
					"achapter" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Глава",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "chapter" } }); },
						"icon"				: "/js/jstree/images/chapter.png"
					},
					"aalternatives" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Варианты",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "alternatives" } }); },
						"icon"				: "/js/jstree/images/alternatives.png"
					},
					"asteps" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Шаги",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "steps" } }); },
						"icon"				: "/js/jstree/images/steps.png"
					},
					"aaction" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Пункт",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "action" } }); },
						"icon"				: "/js/jstree/images/action.png"
					},
					"adocument" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Документ",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "document" } }); },
						"icon"				: "/js/jstree/images/document.png"
					},
					"ahtml" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "HTML",
						"action"			: function (obj) { this.create(obj, "last", { "attr": { "rel": "html" } }); },
						"icon"				: "/js/jstree/images/html.png"
					}
				}
			},
			"change" : {
				"separator_before"	: false,
				"separator_after"	: false,
				"label"				: "Изменить тип",
				"action"			: false,
				"icon"				: "/js/jstree/images/change.png",
				"submenu" : { 
					"cfolder" : {
						"separator_before"	: false,
						"separator_after"	: false,
						"label"				: "Раздел",
						"action"			: function (obj) {
							this.set_type("folder", obj[0]);
							changeNodeType(obj[0].id, "folder");
						},
						"icon"				: "/js/jstree/images/folder.png"
					},
					"cchapter" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Глава",
						"action"			: function (obj) {
							this.set_type("chapter", obj[0]);
							changeNodeType(obj[0].id, "chapter");
						},
						"icon"				: "/js/jstree/images/chapter.png"
					},
					"calternatives" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Варианты",
						"action"			: function (obj) {
							this.set_type("alternatives", obj[0]);
							changeNodeType(obj[0].id, "alternatives");
						},
						"icon"				: "/js/jstree/images/alternatives.png"
					},
					"csteps" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Шаги",
						"action"			: function (obj) {
							this.set_type("steps", obj[0]);
							changeNodeType(obj[0].id, "steps");
						},
						"icon"				: "/js/jstree/images/steps.png"
					},
					"caction" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Пункт",
						"action"			: function (obj) {
							this.set_type("action", obj[0]);
							changeNodeType(obj[0].id, "action");
						},
						"icon"				: "/js/jstree/images/action.png"
					},
					"cdocument" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Документ",
						"action"			: function (obj) {
							this.set_type("document", obj[0]);
							changeNodeType(obj[0].id, "document");
						},
						"icon"				: "/js/jstree/images/document.png"
					},
					"chtml" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "HTML",
						"action"			: function (obj) {
							this.set_type("html", obj[0]);
							changeNodeType(obj[0].id, "html");
						},
						"icon"				: "/js/jstree/images/html.png"
					}
				}
			},
			"rename" : {
				"separator_before"	: false,
				"separator_after"	: false,
				"label"				: "Переименовать",
				"action"			: function (obj) { this.rename(obj); },
				"icon"				: "/js/jstree/images/rename.png"
			},
			"remove" : {
				"separator_before"	: false,
				"icon"				: false,
				"separator_after"	: false,
				"label"				: "Удалить",
				"action"			: function (obj) { if (this.is_selected(obj)) this.remove(); else this.remove(obj); },
				"icon"				: "/js/jstree/images/remove.png"
			},
			"ccp" : {
				"separator_before"	: false,
				"icon"				: false,
				"separator_after"	: false,
				"label"				: "Правка",
				"action"			: false,
				"icon"				: "/js/jstree/images/ccp.png",
				"submenu" : {
					"cut" : {
						"separator_before"	: false,
						"separator_after"	: false,
						"label"				: "Выредать",
						"action"			: function (obj) { this.cut(obj); },
						"icon"				: "/js/jstree/images/cut.png"
					},
					"copy" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Копировать",
						"action"			: function (obj) { this.copy(obj); },
						"icon"				: "/js/jstree/images/copy.png"
					},
					"paste" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Вставить",
						"action"			: function (obj) { this.paste(obj); },
						"icon"				: "/js/jstree/images/paste.png"
					}
				}
			}
		};
		// Filter create node submenu
		var nodeType = this._get_type(node),
			metaType = metadata.types.types[nodeType],
			itemCount = 0;
		for (var cmItem in items.create.submenu) {
			ntItem = cmItem.substring(1);
			if (!inArray(metaType.valid_children, ntItem)) delete items.create.submenu[cmItem];
			else itemCount++;
		}
		if (itemCount==0) delete items.create;
		// Filter change node type submenu
		var parentType = this._get_type(this._get_parent(node)),
			metaType = metadata.types.types[parentType],
			itemCount = 0;
		if (!parentType) delete items.change;
		else {
			for (var cmItem in items.change.submenu) {
				ntItem = cmItem.substring(1);
				if (!inArray(metaType.valid_children, ntItem) || nodeType==cmItem) delete items.change.submenu[cmItem];
				else itemCount++;
			}
			if (itemCount==0) delete items.change;
		}
		return items;
	};

	function displayData(source) {
		if (source) {
			var surrcePath = source.split('/');
			if (surrcePath.length-1!=3) return;
			
			panelCenter.css({padding:'0px'}).html('<div id="myGrid" style="width:100%;height:100%;"></div>');
			
			//	'<div id="commandLine"><textarea style="height:100%; width:100%"></textarea></div>'

			$.get('/dbmi/grid/columns.json?source='+source, function(res) {
				var grid,
					loader = new Slick.Data.RemoteModel(),
					columns = res,
					columnFilters = {},
					options = {
						editable: true,
						enableAddRow: true,
						enableCellNavigation: true,
						syncColumnCellResize: true,
						showHeaderRow: true,
						headerRowHeight: 23,
						explicitInitialization: true
					},
					loadingIndicator = null;
				loader.setFilter({});
				loader.setSource(source);

				for (var i = 0; i <= columns.length-1; i++) {
					columns[i].editor = Slick.Editors.Text;
				}
		    
				$(function () {
					grid = new Slick.Grid("#myGrid", loader.data, columns, options);

					/*loader.data.onRowCountChanged.subscribe(function (e, args) {
						grid.updateRowCount();
						grid.render();
					});
                
					loader.data.onRowsChanged.subscribe(function (e, args) {
						grid.invalidateRows(args.rows);
						grid.render();
					});*/
                
					$(grid.getHeaderRow()).delegate(":input", "change keyup", function (e) {
						var columnId = $(this).data("columnId");
						if (columnId != null) {
							var val = $.trim($(this).val());
							if (val) columnFilters[columnId] = val
							else delete columnFilters[columnId];
						}
						loader.setFilter(columnFilters);
						var vp = grid.getViewport();
						loader.ensureData(vp.top, vp.bottom);
					});
                
					grid.onHeaderRowCellRendered.subscribe(function(e, args) {
						console.dir(args);
						$(args.node).empty();
						$("<input type='text'>")
							.data("columnId", args.column.id)
							.val(columnFilters[args.column.id])
							.appendTo(args.node);
					});

					grid.setColumns(columns);
	            
					grid.onViewportChanged.subscribe(function (e, args) {
						var vp = grid.getViewport();
						loader.ensureData(vp.top, vp.bottom);
					});
	            
					grid.onSort.subscribe(function (e, args) {
						loader.setSort(args.sortCol.field, args.sortAsc ? 1 : -1);
						var vp = grid.getViewport();
						loader.ensureData(vp.top, vp.bottom);
					});
	            
					loader.onDataLoading.subscribe(function () {
						if (!loadingIndicator) {
							loadingIndicator = $("<span class='loading-indicator'><label>Buffering...</label></span>").appendTo(document.body);
							var $g = $("#myGrid");
							loadingIndicator
								.css("position", "absolute")
								.css("top", $g.position().top + $g.height() / 2 - loadingIndicator.height() / 2)
								.css("left", $g.position().left + $g.width() / 2 - loadingIndicator.width() / 2);
						}
						loadingIndicator.show();
					});
	            
					loader.onDataLoaded.subscribe(function (e, args) {
						for (var i = args.from; i <= args.to; i++) grid.invalidateRow(i);
						grid.updateRowCount();
						grid.render();
						loadingIndicator.fadeOut();
					});
	            
					//loader.setSort("create_ts", -1);
					//grid.setSortColumn("date", false);
	            
					// load the first page
					grid.onViewportChanged.notify();
					grid.init();
					
				});
			});
		}
	};

});

$.ajaxSetup({cache: false});

jQuery.fn.enable = function(flag) {
	if (flag) this.removeClass('disabled'); else this.addClass('disabled');
}

jQuery.fn.visible = function(flag) {
	if (flag) this.show(); else this.hide();
}

jQuery.fn.reload = function(url, callback) {
	var panel = this;
	panel.scroller('remove').empty().html('<div class="progress"></div>').load(url, function() {
		//panel.removeAttr('style').scroller('y');
		panel.scroller('y');
		if (global.platform.iOS) panel.width(panel.width()-1);
		$('a.default', panel).click();
		if (callback) callback.call(panel);
		//$('textarea').autoResize({ animateDuration: 300, extraSpace: 20 }).trigger('change');
		//refreshControls();
	});
}

$.fn.alignCenter = function() {
	var marginLeft = Math.max(40, parseInt($(window).width()/2 - $(this).width()/2)) + 'px';
	var marginTop = Math.max(40, parseInt($(window).height()/2 - $(this).height()/2)) + 'px';
	return $(this).css({'margin-left':marginLeft, 'margin-top':marginTop});
}

$.fn.togglePopup = function() {
	if ($('#popup').hasClass('hidden')) {
		if (global.platform.IE) {
			$('#darken').height($(document).height()).toggleClass('hidden');
		} else {
			$('#darken').height($(document).height()).toggleClass('hidden').fadeTo('slow', 0.5).click(function(event) {
				event.stopPropagation();
				var form = $('#popup .form');
				if ($(form).length) $(form).togglePopup();
			});
		}
		$(this).appendTo('#popup');
		$('#popup').alignCenter().toggleClass('hidden');
		$('form :input:visible:enabled:first',this).focus();
	} else {
		$('#darken').toggleClass('hidden').removeAttr('style');
		$('#popup').toggleClass('hidden').removeAttr('style');
		$('#popup .form').appendTo('#forms');
	}
}

function closeForm() {
	Form = $('#popup .form');
	var $inputs = $('form select:input',Form);
	$inputs.each(function() {
		//alert($(this).val());
		$(this).combobox('destroy');
	});
	if (Form.length) $(Form).togglePopup();
}

$(document).keydown(function(event) {
	if      (event.keyCode == 27) closeForm();
	else if (event.keyCode == 13) $('#popup .form .save').trigger('click');
});

$(document).on('click', '#popup .cancel', function(event) {
	closeForm();
	return false;
});

// --- Confirmation ---

// Buttons: ['Yes','No','Ok','Cancel']
function confirmation(Title,Message,eventYes,Buttons) {
	var form = $('#formConfirmation');
	if (typeof(Buttons)=='undefined') Buttons = ['Cancel','Yes'];
	$('.header',form).html(Title);
	$('.message',form).html('<br/>'+Message+'<br/><br/>');
	formConfirmationYes = eventYes;
	$('#formConfirmationYes').visible($.inArray('Yes', Buttons)>-1);
	$('#formConfirmationOk').visible($.inArray('Ok', Buttons)>-1);
	$('#formConfirmationNo').visible($.inArray('No', Buttons)>-1);
	$('#formConfirmationCancel').visible($.inArray('Cancel', Buttons)>-1);
	form.togglePopup();
}

$(document).on('click','#formConfirmation .button.save',function(event) {
	if (typeof(formConfirmationYes)=='function') formConfirmationYes();
	formConfirmationYes = null;
	closeForm();
	return false;
});

// --- Input ---

function input(Title,Prompt,DefaultValue,eventOk) {
	var form = $('#formInput');
	$('.header',form).html(Title);
	//$('.message',form).html(Message);
	$('.field .label',form).html(Prompt);
	//if (DefaultValue)
	$('#formInputValue').val(DefaultValue);
	formInputOk = eventOk;
	form.togglePopup();
}

$(document).on('click','#formInputOk',function(event) {
	if (formInputOk) formInputOk($('#formInputValue').val());
	formInputOk = null;
	closeForm();
	return false;
});