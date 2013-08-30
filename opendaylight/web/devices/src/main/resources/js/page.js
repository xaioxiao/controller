/* 
 * Copyright (c) 2013 Cisco Systems, Inc. and others.  All rights reserved. 
 * 
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License v1.0 which accompanies this distribution, 
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 */

//PAGE Devices
one.f = {};

// specify dashlets and layouts

one.f.dashlet = {
    nodesLearnt : {
        id : 'nodesLearnt',
        name : 'Nodes Learned'
    },
    staticRouteConfig : {
        id : 'staticRouteConfig',
        name : 'Static Route Configuration'
    },
    subnetGatewayConfig : {
        id : 'subnetGatewayConfig',
        name : 'Subnet Gateway Configuration'
    },
    spanPortConfig : {
        id : 'spanPortConfig',
        name : 'SPAN Port Configuration'
    }
};

one.f.menu = {
    left : {
        top : [
            one.f.dashlet.nodesLearnt
        ],
        bottom : [
            one.f.dashlet.staticRouteConfig
        ]
    },
    right : {
        top : [],
        bottom : [
            one.f.dashlet.subnetGatewayConfig,
            one.f.dashlet.spanPortConfig
        ]
    }
};

/**Devices Modules */
one.f.switchmanager = {
    rootUrl: "controller/web/devices",
    createTable: function(columnNames, body) {
        var tableAttributes = ["table-striped", "table-bordered", "table-condensed"];
        var $table = one.lib.dashlet.table.table(tableAttributes);
        var tableHeaders = columnNames;
        var $thead = one.lib.dashlet.table.header(tableHeaders);
        var $tbody = one.lib.dashlet.table.body(body, tableHeaders);
        $table.append($thead)
        .append($tbody);
        return $table;
    },
    validateName: function(name) {
        return (name.length < 256);
    }
};

one.f.switchmanager.nodesLearnt = {
    id: {
        dashlet: {
            popout: "one_f_switchmanager_nodesLearnt_id_dashlet_popout",
            datagrid: "one_f_switchmanager_nodesLearnt_id_dashlet_datagrid"
        },
        modal: {
            modal: "one_f_switchmanager_nodesLearnt_id_modal_modal",
            configure: "one_f_switchmanager_nodesLearnt_id_modal_configure",
            ports: "one_f_switchmanager_nodesLearnt_id_modal_ports",
            save: "one_f_switchmanager_nodesLearnt_id_modal_save",
            datagrid: "one_f_switchmanager_nodesLearnt_id_modal_datagrid",
            portsDatagrid: "one_f_switchmanager_nodesLearnt_id_modal_portsDatagrid",
            form: {
                nodeId: "one_f_switchmanager_nodesLearnt_id_modal_form_nodeid",
                nodeName : "one_f_switchmanager_nodesLearnt_id_modal_form_nodename",
                portStatus : "one_f_switchmanager_nodesLearnt_id_modal_form_portstatus",
                tier: "one_f_switchmanager_nodesLearnt_id_modal_form_tier",
                operationMode: "one_f_switchmanager_nodesLearnt_id_modal_form_opmode"
            }
        }
    },
    dashlet: function($dashlet) {
        var url = one.f.switchmanager.rootUrl + "/nodesLearnt";
        one.lib.dashlet.empty($dashlet);
        $dashlet.append(one.lib.dashlet.header(one.f.dashlet.nodesLearnt.name));

        one.f.switchmanager.nodesLearnt.ajax.main(url, function(content) {
            var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.nodesLearnt.id.dashlet.datagrid, {
                searchable: true,
                filterable: false,
                pagination: true,
                flexibleRowsPerPage: true
                }, "table-striped table-condensed");
            $dashlet.append($gridHTML);
            var dataSource = one.f.switchmanager.nodesLearnt.data.gridDataSource.abridged(content);
            $("#" + one.f.switchmanager.nodesLearnt.id.dashlet.datagrid).datagrid({dataSource: dataSource}).on("loaded", function() {
                $(this).find("tbody a").click(one.f.switchmanager.nodesLearnt.modal.initialize.updateNode);
            });
            
            $("#" + one.f.switchmanager.nodesLearnt.id.dashlet.datagrid).datagrid({dataSource: dataSource}).on("loaded", function() {
                $(this).find("tbody span").click(function(){
                    one.f.switchmanager.nodesLearnt.modal.initialize.displayPorts($(this));
                });
            });
            
        });
    },
    ajax : {
        main : function(url, callback) {
            $.getJSON(url, function(data) {
                callback(data);
            });
        }
    },
    modal : {
        initialize: {
            updateNode: function(evt) {
                one.f.switchmanager.nodesLearnt.ajax.main(one.f.switchmanager.rootUrl + "/tiers", function(tiers) {

                    var nodeId = decodeURIComponent(evt.target.id);
                    var h3;
                    var footer = [];
                    var $body = one.f.switchmanager.nodesLearnt.modal.body.updateNode(nodeId, JSON.parse(decodeURIComponent(evt.target.getAttribute("switchDetails"))), tiers);
                    if (evt.target.getAttribute("privilege") == 'WRITE'){
                        h3 = "Update Node Information";
                        footer = one.f.switchmanager.nodesLearnt.modal.footer.updateNode();
                    } else { //disable node edit
                        $body.find('*').attr('disabled', 'disabled');
                        h3 = 'Node Information';
                    }
                    
                    var $modal = one.lib.modal.spawn(one.f.switchmanager.nodesLearnt.id.modal.configure, h3, "", footer);
                    // bind save button
                    $('#' + one.f.switchmanager.nodesLearnt.id.modal.save, $modal).click(function() {
                        one.f.switchmanager.nodesLearnt.modal.save($modal);
                    });

                    // inject body (nodePorts)
                    one.lib.modal.inject.body($modal, $body);
                    $modal.modal();
                });
            },
            popout: function() {
                var h3 = "Nodes Learned";
                var footer = one.f.switchmanager.nodesLearnt.modal.footer.popout();
                var $modal = one.lib.modal.spawn(one.f.switchmanager.nodesLearnt.id.modal.modal, h3, "", footer);
                var $body = one.f.switchmanager.nodesLearnt.modal.body.popout($modal);
                return $modal;
            },
            displayPorts: function(ports) {
                var content = JSON.parse(decodeURIComponent(ports.attr("ports")));
                
                var h3 = ((ports.attr("nodeName") == "None")? ports.attr("nodeId") : ports.attr("nodeName"))
                var footer = [];
                var $modal = one.lib.modal.spawn(one.f.switchmanager.nodesLearnt.id.modal.ports, h3, "", footer);
                
                var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.nodesLearnt.id.modal.portsDatagrid, {
                    searchable: true,
                    filterable: false,
                    pagination: true,
                    flexibleRowsPerPage: true,
                    popout: true
                    }, "table-striped table-condensed");
                one.lib.modal.inject.body($modal, $gridHTML);
                $modal.on("shown", function() {
                    var dataSource = one.f.switchmanager.nodesLearnt.data.gridDataSource.displayPorts(content);
                    $("#" + one.f.switchmanager.nodesLearnt.id.modal.portsDatagrid).datagrid({
                        dataSource: dataSource,
                        stretchHeight: false
                    });
                });
                $modal.modal();
            }
        },
        body: {
            updateNode: function(nodeId, switchDetails, tiers) {
                var $form = $(document.createElement('form'));
                var $fieldset = $(document.createElement('fieldset'));
                // node ID. not editable.
                var $label = one.lib.form.label("Node ID");
                var $input = one.lib.form.input("node id");
                $input.attr('id', one.f.switchmanager.nodesLearnt.id.modal.form.nodeId);
                $input.attr("disabled", true);
                $input.attr("value", nodeId);
                $fieldset.append($label).append($input);
                // node name
                var $label = one.lib.form.label("Node Name");
                var $input = one.lib.form.input("Node Name");
                $input.attr('id', one.f.switchmanager.nodesLearnt.id.modal.form.nodeName);
                if(switchDetails["nodeName"] != null) {
                    $input.attr('value', switchDetails["nodeName"]);
                }
                $fieldset.append($label).append($input);
                // node tier
                var $label = one.lib.form.label("Tier");
                var $select = one.lib.form.select.create(tiers);
                $select.attr('id', one.f.switchmanager.nodesLearnt.id.modal.form.tier);
                $select.val(switchDetails["tier"]);
                $fieldset.append($label).append($select);
                // operation mode
                var $label = one.lib.form.label("Operation Mode");
                var $select = one.lib.form.select.create(
                        ["Allow reactive forwarding", "Proactive forwarding only"]);
                $select.attr('id', one.f.switchmanager.nodesLearnt.id.modal.form.operationMode);
                if ((one.main.registry != undefined) && (one.main.registry.container != 'default')) {
                    $select.attr("disabled", true);
                }
                $select.val(switchDetails["mode"]);
                $fieldset.append($label).append($select);
                $form.append($fieldset);
                return $form;
            },
            popout: function($modal) {
                var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.nodesLearnt.id.modal.datagrid, {
                        searchable: true,
                        filterable: false,
                        pagination: true,
                        flexibleRowsPerPage: true,
                        popout: true
                        }, "table-striped table-condensed");
                one.lib.modal.inject.body($modal, $gridHTML);
                // attach to shown event of modal 
                $modal.on("shown", function() {
                    var url = one.f.switchmanager.rootUrl + "/nodesLearnt";
                    one.f.switchmanager.nodesLearnt.ajax.main(url, function(content) {
                        var dataSource = one.f.switchmanager.nodesLearnt.data.gridDataSource.popout(content);
                        $("#" + one.f.switchmanager.nodesLearnt.id.modal.datagrid).datagrid({
                            dataSource: dataSource,
                            stretchHeight: false
                        })
                        .on("loaded", function() {
                            $("#" + one.f.switchmanager.nodesLearnt.id.modal.datagrid).find("tbody span").click(function(){
                                one.f.switchmanager.nodesLearnt.modal.initialize.displayPorts($(this));
                            });
                        });
                    });
                });
            }
        },
        save: function($modal) {
            var result = {};
            result['nodeName'] = $('#' + one.f.switchmanager.nodesLearnt.id.modal.form.nodeName, $modal).val();
            if(!one.f.switchmanager.validateName(result['nodeName'])) {
                alert("Node name can contain upto 255 characters");
                return;
            }
            result['nodeId'] = $('#' + one.f.switchmanager.nodesLearnt.id.modal.form.nodeId, $modal).val();
            result['tier'] = $('#' + one.f.switchmanager.nodesLearnt.id.modal.form.tier, $modal).val();
            result['operationMode'] = $('#' + one.f.switchmanager.nodesLearnt.id.modal.form.operationMode, $modal).val();
            one.f.switchmanager.nodesLearnt.modal.ajax(result, 
                function(response) {
                    if(response.status == true) {
                        $modal.modal('hide');
                        one.topology.update(); // refresh visual topology with new name
                        // TODO: Identify dashlet by inserting a nodesLearnt div 
                        // in the dashlet() instead
                        one.f.switchmanager.nodesLearnt.dashlet($("#left-top .dashlet"));
                    } else {
                        alert(response.message);
                    }
                    
                });
        },
        ajax: function(requestData, callback) {
            $.getJSON(one.f.switchmanager.rootUrl + "/nodesLearnt/update", requestData, function(response) {
                callback(response);
            });
        },
        footer: {
            updateNode: function() {
                var footer = [];
                var saveButton = one.lib.dashlet.button.single("Save", one.f.switchmanager.nodesLearnt.id.modal.save, "btn-success", "");
                var $saveButton = one.lib.dashlet.button.button(saveButton);
                footer.push($saveButton);

                return footer;
            },
            popout: function() {
                // TODO: Maybe put a close button in the footer?
                return [];
            }
        }
    },
    // data functions
    data : {
        gridDataSource: {
            abridged: function(data) {
                var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'nodeName',
                            label: 'Node Name',
                            sortable: true
                        },
                        {
                            property: 'nodeId',
                            label: 'Node ID',
                            sortable: true
                        },
                        {
                            property: 'ports',
                            label: 'Ports',
                            sortable: true
                        }
                    ],
                    data: data.nodeData,
                    formatter: function(items) {
                    $.each(items, function (index, item) {
                        var nodeName = item.nodeName;
                        var nodeNameEntry = item.nodeName ? item.nodeName : "Click to update";
                        item.nodeName = '<a href="#" id="' + item.nodeId + '" switchDetails=' + encodeURIComponent(JSON.stringify(item)) + 
                        ' privilege=' + data.privilege + '>' + nodeNameEntry + '</a>';
                        
                        var ports = item.ports;
                        var portsMatch = ports.match(/<\/span>/g);
                        var portsLength = 0;
                        if (portsMatch != null) {
                            portsLength = portsMatch.length;
                        }
                        item.ports = '<span class="nodePorts" style="cursor:pointer;color: #08c" ports='+encodeURIComponent(JSON.stringify(item.ports)) + ' nodeId=' + item.nodeId 
                            + ' nodeName=' + nodeName  
                            + '>' + portsLength +'</span>';
                    }); 
                    },
                    delay: 0
                });
                return source;

            },
            popout: function(data) {
                var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'nodeName',
                            label: 'Node Name',
                            sortable: true
                        },
                        {
                            property: 'nodeId',
                            label: 'Node ID',
                            sortable: true
                        },
                        {
                            property: 'tierName',
                            label: 'Tier Name',
                            sortable: true
                        },
                        {
                            property: 'mac',
                            label: 'MAC',
                            sortable: true
                        },
                        {
                            property: 'ports',
                            label: 'Ports',
                            sortable: true
                        }
                    ],
                    data: data.nodeData,
                    formatter: function(items) {
                        $.each(items, function (index, item) {
                            var ports = item.ports;
                            var portsMatch = ports.match(/<\/span>/g);
                            var portsLength = 0;
                            if (portsMatch != null) {
                                portsLength = portsMatch.length;
                            }
                            item.ports = '<span class="nodePorts" style="cursor: pointer;color: #08c" ports='+encodeURIComponent(JSON.stringify(item.ports)) + ' nodeId=' + item.nodeId 
                                + ' nodeName=' + item.nodeName  
                                + '>' + portsLength +'</span>';
                        }); 
                    },
                    delay: 0
                });
                return source;
            },
            displayPorts: function(content){
                var data=[];
                var start=0;;
                var finish=content.indexOf("<br>",start);
                while(finish != -1){
                    data.push({"ports":content.substring(start,finish)});
                    start=finish+4
                    finish=content.indexOf("<br>",start);
                }
                var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'ports',
                            label: 'Ports',
                            sortable: true
                        }
                    ],
                    data:data,
                    delay: 0
                });
                
                return source;
            }
        },
        abridged : function(data) {
            var result = [];
            $.each(data.nodeData, function(key, value) {
                var tr = {};
                var entry = [];
                var nodeNameEntry = value["nodeName"] ? value["nodeName"] : "Click to update";

                // TODO: Move anchor tag creation to one.lib.form.
                var aTag;
                aTag = document.createElement("a");
                aTag.privilege = data.privilege;
                aTag.addEventListener("click", one.f.switchmanager.nodesLearnt.modal.initialize.updateNode);
                aTag.addEventListener("mouseover", function(evt) {
                    evt.target.style.cursor = "pointer";
                }, false);
                aTag.setAttribute("id", encodeURIComponent(value["nodeId"]));
                aTag.switchDetails = value;
                aTag.innerHTML = nodeNameEntry;
                entry.push(aTag);
                entry.push(value["nodeId"]);
                entry.push(value["ports"]);
                tr.entry = entry;
                result.push(tr);
            });
            return result;
        },
        popout : function(data) {
            var result = [];
            $.each(data.nodeData, function(key, value) {
                var tr = {};
                // fill up all the td's
                var entry = [];
                var nodenameentry = value["nodeName"] ? value["nodeName"] : "No name provided";
                entry.push(nodenameentry);
                entry.push(value["nodeId"]);
                entry.push(value["tierName"]);
                entry.push(value["mac"]);
                entry.push(value["ports"]);
                tr.entry = entry;
                result.push(tr);
            });
            return result;
        }
    }
};

one.f.switchmanager.subnetGatewayConfig = {
    id: {
        dashlet: {
            addIPAddress: "one_f_switchmanager_subnetGatewayConfig_id_dashlet_addIP",
            addPorts: "one_f_switchmanager_subnetGatewayConfig_id_dashlet_addPorts",
            removeIPAddress: "one_f_switchmanager_subnetGatewayConfig_id_dashlet_removeIP",
            datagrid: "one_f_switchmanager_subnetGatewayConfig_id_dashlet_datagrid",
            selectAll: "one_f_switchmanager_subnetGatewayConfig_id_dashlet_selectAll"
        }, 
        modal: {
            modal: "one_f_switchmanager_subnetGatewayConfig_id_modal_modal",
            save: "one_f_switchmanager_subnetGatewayConfig_id_modal_save",
            form: {
                name : "one_f_switchmanager_subnetGatewayConfig_id_modal_form_gatewayname",
                gatewayIPAddress : "one_f_switchmanager_subnetGatewayConfig_id_modal_form_gatewayipaddress",
                nodeId: "one_f_switchmanager_subnetGatewayConfig_id_modal_form_nodeid",
                ports: "one_f_switchmanager_subnetGatewayConfig_id_modal_form_ports"
            }
        }
    },
    // device ajax calls
    dashlet: function($dashlet) {
        one.lib.dashlet.empty($dashlet);
        $dashlet.append(one.lib.dashlet.header(one.f.dashlet.subnetGatewayConfig.name));
        // Add gateway IP Address button
        var url = one.f.switchmanager.rootUrl + "/subnets";
        one.f.switchmanager.subnetGatewayConfig.ajax.main(url, {}, function(content) {

            if (content.privilege === 'WRITE') {
                var button = one.lib.dashlet.button.single("Add Gateway IP Address",
                    one.f.switchmanager.subnetGatewayConfig.id.dashlet.addIPAddress, "btn-primary", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {
                    var $modal = one.f.switchmanager.subnetGatewayConfig.modal.initialize.gateway();
                    $modal.modal();
                });
                $dashlet.append($button);

                // Delete gateway ip address button
                var button = one.lib.dashlet.button.single("Delete Gateway IP Address",
                    one.f.switchmanager.subnetGatewayConfig.id.dashlet.removeIPAddress, "btn-danger", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {
                    var requestData = {};
                    var gatewaysToDelete = [];
                    var checkedCheckBoxes = $("#" + one.f.switchmanager.subnetGatewayConfig.id.dashlet.datagrid).find("tbody input:checked")
                    checkedCheckBoxes.each(function(index, value) {
                        gatewaysToDelete.push(checkedCheckBoxes[index].id);
                    });
                    if (checkedCheckBoxes.size() === 0) {
                    	alert('Please select at least one gateway');
                    	return false;
                    }
                    if (gatewaysToDelete.length > 0) {
                        requestData["gatewaysToDelete"] = gatewaysToDelete.toString();
                        var url = one.f.switchmanager.rootUrl + "/subnetGateway/delete";
                        one.f.switchmanager.subnetGatewayConfig.ajax.main(url, requestData, function(response) {
                            if (response.status == true) {
                                // refresh dashlet by passing dashlet div as param 
                                one.lib.alert("Subnet Gateway(s) successfully removed");
                            } else {
                                one.lib.alert(response.message);
                            }
                            one.f.switchmanager.subnetGatewayConfig.dashlet($("#right-bottom .dashlet"));
                        });
                    }
                });
                $dashlet.append($button);

                // Add Ports button
                var button = one.lib.dashlet.button.single("Add Ports",
                    one.f.switchmanager.subnetGatewayConfig.id.dashlet.addPorts, "btn-primary", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {
                    var $modal = one.f.switchmanager.subnetGatewayConfig.modal.initialize.ports();
                    $modal.modal();
                });
                $dashlet.append($button);
            }
            var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.subnetGatewayConfig.id.dashlet.datagrid, {
                searchable: true,
                filterable: false,
                pagination: true,
                flexibleRowsPerPage: true
                }, "table-striped table-condensed");
            $dashlet.append($gridHTML);
            var dataSource = one.f.switchmanager.subnetGatewayConfig.data.devicesgrid(content);
            $("#" + one.f.switchmanager.subnetGatewayConfig.id.dashlet.datagrid).datagrid({dataSource: dataSource})
            .on("loaded", function() {
                $("#"+one.f.switchmanager.subnetGatewayConfig.id.dashlet.selectAll).click(function() {
                    $("#" + one.f.switchmanager.subnetGatewayConfig.id.dashlet.datagrid).find(':checkbox').prop('checked',
                        $("#"+one.f.switchmanager.subnetGatewayConfig.id.dashlet.selectAll).is(':checked'));
                });
                $(".subnetGatewayConfig").click(function(e){
                    if (!$('.subnetGatewayConfig[type=checkbox]:not(:checked)').length) {
                        $("#"+one.f.switchmanager.subnetGatewayConfig.id.dashlet.selectAll)
                            .prop("checked",
                          true);
                    } else {
                        $("#"+one.f.switchmanager.subnetGatewayConfig.id.dashlet.selectAll)
                            .prop("checked",
                         false);
                    }
                    e.stopPropagation();
                });
             });
        });
    },
    ajax : {
        main : function(url, requestData, callback) {
            $.getJSON(url, requestData, function(data) {
                callback(data);
            });
        }
    },
    registry: {},
    modal : {
        initialize: {
            gateway: function() {
                var h3 = "Add Gateway IP Address";
                var footer = one.f.switchmanager.subnetGatewayConfig.modal.footer();
                var $modal = one.lib.modal.spawn(one.f.switchmanager.subnetGatewayConfig.id.modal.modal, h3, "", footer);
                // bind save button
                $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.save, $modal).click(function() {
                    one.f.switchmanager.subnetGatewayConfig.modal.save.gateway($modal);
                });
                var $body = one.f.switchmanager.subnetGatewayConfig.modal.body.gateway();
                one.lib.modal.inject.body($modal, $body);
                return $modal;
            },
            ports: function() {
                var h3 = "Add Ports";
                var footer = one.f.switchmanager.subnetGatewayConfig.modal.footer();
                var $modal = one.lib.modal.spawn(one.f.switchmanager.subnetGatewayConfig.id.modal.modal, h3, "", footer);
                // bind save button
                $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.save, $modal).click(function() {
                    one.f.switchmanager.subnetGatewayConfig.modal.save.ports($modal);
                });
                
                // TODO: Change to subnetGateway instead.
                one.f.switchmanager.spanPortConfig.modal.ajax.nodes(function(nodes, nodeports) {
                    var $body = one.f.switchmanager.subnetGatewayConfig.modal.body.ports(nodes, nodeports);
                    one.lib.modal.inject.body($modal, $body);
                });
                return $modal;
            }
        },
        save: {
            gateway: function($modal) {
                var result = {};
                result['gatewayName'] = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.name, $modal).val();
                if(!one.f.switchmanager.validateName(result['gatewayName'])) {
                    alert("Gateway name can contain upto 255 characters");
                    return;
                }
                result['gatewayIPAddress'] = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.gatewayIPAddress, $modal).val();
                one.f.switchmanager.subnetGatewayConfig.modal.ajax.gateway(result, 
                    function(response) {
                        if(response.status == true) {
                            $modal.modal('hide');
                            one.f.switchmanager.subnetGatewayConfig.dashlet($("#right-bottom .dashlet"));
                        } else {
                            alert(response.message);
                        }
                    });
            },
            ports: function($modal) {
                var result = {};
                var gatewayRegistryIndex = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.name, $modal).val();
                result['portsName'] = one.f.switchmanager.subnetGatewayConfig.registry.gateways[gatewayRegistryIndex];
                result['nodeId'] = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.nodeId, $modal).val();
                result['ports'] = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.ports, $modal).val();
                if(!result['portsName'] || result['portsName'] == "") {
                    alert("No gateway chosen. Cannot add port");
                    return;
                }
                if(!result['nodeId'] || result['nodeId'] == "") {
                    alert("Please select a node.");
                    return;
                }
                if(!result['ports'] || result['ports'] == "") {
                    alert("Please choose a port.");
                    return;
                }
                one.f.switchmanager.subnetGatewayConfig.modal.ajax.ports(result, 
                    function(response) {
                        if(response.status == true) {
                            $modal.modal('hide');
                            one.f.switchmanager.subnetGatewayConfig.dashlet($("#right-bottom .dashlet"));
                        } else {
                            alert(response.message);
                        }
                    });
            }
        },
        body: {
            gateway: function() {
                var $form = $(document.createElement('form'));
                var $fieldset = $(document.createElement('fieldset'));
                // gateway name
                var $label = one.lib.form.label("Name");
                var $input = one.lib.form.input("Name");
                $input.attr('id', one.f.switchmanager.subnetGatewayConfig.id.modal.form.name);
                $fieldset.append($label).append($input);
                // gateway IP Mask 
                var $label = one.lib.form.label("Gateway IP Address/Mask");
                var $input = one.lib.form.input("Gateway IP Address/Mask");
                $input.attr('id', one.f.switchmanager.subnetGatewayConfig.id.modal.form.gatewayIPAddress);
                $fieldset.append($label).append($input);
                
                $form.append($fieldset);
                return $form;
            },
            ports: function(nodes, nodeports) {
                var $form = $(document.createElement('form'));
                var $fieldset = $(document.createElement('fieldset'));
                // gateways drop down
                var $label = one.lib.form.label("Gateway Name");
                var $select = one.lib.form.select.create(one.f.switchmanager.subnetGatewayConfig.registry.gateways);
                $select.attr('id', one.f.switchmanager.subnetGatewayConfig.id.modal.form.name);
                $select.val($select.find("option:first").val());
                $fieldset.append($label).append($select);

                // node ID
                var $label = one.lib.form.label("Node ID");
                var $select = one.lib.form.select.create(nodes);
                $select.attr('id', one.f.switchmanager.subnetGatewayConfig.id.modal.form.nodeId);
                one.lib.form.select.prepend($select, { '' : 'Please Select a Node' });
                $select.val($select.find("option:first").val());
                $fieldset.append($label).append($select);

                // bind onchange
                $select.change(function() {
                    // retrieve port value
                    var node = $(this).find('option:selected').attr('value');
                    one.f.switchmanager.subnetGatewayConfig.registry['currentNode'] = node;
                    var $ports = $('#' + one.f.switchmanager.subnetGatewayConfig.id.modal.form.ports);
                    var ports = nodeports[node];
                    one.lib.form.select.inject($ports, ports);
                    one.lib.form.select.prepend($ports, { '' : 'Please Select a Port' });
                    $ports.val($ports.find("option:first").val());
                });

                // ports
                var $label = one.lib.form.label("Select Port");
                var $select = one.lib.form.select.create();
                $select.attr('id', one.f.switchmanager.subnetGatewayConfig.id.modal.form.ports);
                $fieldset.append($label).append($select);
                
                $form.append($fieldset);
                return $form;
            }
        },
        ajax: {
            gateway: function(requestData, callback) {
                $.getJSON(one.f.switchmanager.rootUrl + "/subnetGateway/add", requestData, function(data) {
                    callback(data);
            });
            },
            ports: function(requestData, callback) {
                $.getJSON(one.f.switchmanager.rootUrl + "/subnetGateway/ports/add", requestData, function(data) {
                    callback(data);
            });
            }
        },
        footer : function() {
            var footer = [];
            var saveButton = one.lib.dashlet.button.single("Save", one.f.switchmanager.subnetGatewayConfig.id.modal.save, "btn-success", "");
            var $saveButton = one.lib.dashlet.button.button(saveButton);
            footer.push($saveButton);
            return footer;
        }
    },
    // data functions
    data : {
        devicesgrid: function(data) {
            one.f.switchmanager.subnetGatewayConfig.registry.gateways = [];
            var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'selector',
                            label: "<input type='checkbox'  id='"
                                +one.f.switchmanager.subnetGatewayConfig.id.dashlet.selectAll+"'/>",
                            sortable: false
                        },
                        {
                            property: 'name',
                            label: 'Name',
                            sortable: true
                        },
                        {
                            property: 'subnet',
                            label: 'Gateway IP Address/Mask',
                            sortable: true
                        },
                        {
                            property: 'nodePorts',
                            label: 'Node/Ports',
                            sortable: false
                        }
                    ],
                    data: data.nodeData,
                    formatter: function(items) {
                        $.each(items, function(index, tableRow) {
                            tableRow["selector"] = '<input type="checkbox" class="subnetGatewayConfig" id=' 
                                + tableRow["name"] + '></input>';
                            var json = tableRow["nodePorts"];
                            var nodePorts = JSON.parse(json);
                            var nodePortHtml = "<div>";
                            $.each(nodePorts, function(index, nodePort) {
                                var nodePortID = nodePort["nodeId"] + "/" + nodePort["nodePortId"]; 
                                nodePortHtml += nodePort["nodeName"] + " / " + nodePort["nodePortName"];
                                nodePortHtml += "&nbsp;";
                                nodePortHtml += '<a href="#" id=' + encodeURIComponent(nodePortID) + 
                                    ' gatewayName=' + tableRow["name"] + 
                                    ' onclick="javascript:one.f.switchmanager.subnetGatewayConfig.actions.deleteNodePort(this);">Delete</a>';
                                nodePortHtml += "<br/>";
                            });
                            nodePortHtml += "</div>";
                            tableRow["nodePorts"] = nodePortHtml;
                        });

                    },
                    delay: 0
                });
                // populate the registry with subnet names
                one.f.switchmanager.subnetGatewayConfig.registry.gateways = [];
                $.each(data.nodeData, function(key, value) {
                    one.f.switchmanager.subnetGatewayConfig.registry.gateways.push(value["name"]);
                });
                return source;          
        },
        devices : function(data) {
            var result = [];
            one.f.switchmanager.subnetGatewayConfig.registry.gateways = [];
            $.each(data.nodeData, function(key, value) {
                var tr = {};
                // fill up all the td's
                var subnetConfigObject = $.parseJSON(value["json"]);
                var nodePorts = subnetConfigObject.nodePorts;
                var $nodePortsContainer = $(document.createElement("div"));
                
                for(var i = 0; i < nodePorts.length; i++) {
                    var nodePort = nodePorts[i];
                    $nodePortsContainer.append(nodePort + " ");
                    // add delete anchor tag to delete ports
                    var aTag = document.createElement("a");
                    aTag.setAttribute("id", encodeURIComponent(nodePort));
                    aTag.gatewayName = value["name"];
                    aTag.addEventListener("click", function(evt) {
                        var htmlPortAnchor = evt.target;
                        var requestData = {};
                        requestData["gatewayName"] = evt.target.gatewayName;
                        requestData["nodePort"] = decodeURIComponent(evt.target.id);
                        // make ajax call to delete port
                        var url = one.f.switchmanager.rootUrl + "/subnetGateway/ports/delete";
                        one.f.switchmanager.subnetGatewayConfig.ajax.main(url, requestData, function(response) {
                            if(response.status == true) {
                                // refresh dashlet by passing dashlet div as param
                                one.f.switchmanager.subnetGatewayConfig.dashlet($("#right-bottom .dashlet"));
                            } else {
                                alert(response.message);
                            }
                        });
                        
                    });
                    aTag.addEventListener("mouseover", function(evt) {
                        evt.target.style.cursor = "pointer";
                    }, false);
                    aTag.innerHTML = "Delete";
                    $nodePortsContainer.append(aTag);
                    $nodePortsContainer.append("<br/>");
                }

                // store gateways in the registry so that they can be used in the add ports popup
                one.f.switchmanager.subnetGatewayConfig.registry.gateways.push(value["name"]);
                var entry = [];
                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                checkbox.setAttribute("id", value["name"]);
                entry.push(checkbox);
                entry.push(value["name"]);
                entry.push(value["subnet"]);
                entry.push($nodePortsContainer);
                tr.entry = entry;
                result.push(tr);
            });
            return result;
        }
    },
    actions: {
        deleteNodePort: function(htmlPortAnchor) {
            var requestData = {};
            requestData["gatewayName"] = htmlPortAnchor.getAttribute("gatewayName");
            requestData["nodePort"] = decodeURIComponent(htmlPortAnchor.id);
            // make ajax call to delete port
            var url = one.f.switchmanager.rootUrl + "/subnetGateway/ports/delete";
            one.f.switchmanager.subnetGatewayConfig.ajax.main(url, requestData, function(response) {
                if(response.status == true) {
                    // refresh dashlet by passing dashlet div as param
                    one.f.switchmanager.subnetGatewayConfig.dashlet($("#right-bottom .dashlet"));
                } else {
                    alert(response.message);
                }
            });
        }
    }
}

one.f.switchmanager.staticRouteConfig = {
    id: {
        dashlet: {
            add: "one_f_switchmanager_staticRouteConfig_id_dashlet_add",
            remove: "one_f_switchmanager_staticRouteConfig_id_dashlet_remove",
            datagrid: "one_f_switchmanager_staticRouteConfig_id_dashlet_datagrid",
            selectAll: "one_f_switchmanager_staticRouteConfig_id_dashlet_selectAll"
        }, 
        modal: {
            modal: "one_f_switchmanager_staticRouteConfig_id_modal_modal",
            save: "one_f_switchmanager_staticRouteConfig_id_modal_save",
            form: {
                routeName : "one_f_switchmanager_staticRouteConfig_id_modal_form_routename",
                staticRoute : "one_f_switchmanager_staticRouteConfig_id_modal_form_staticroute",
                nextHop : "one_f_switchmanager_staticRouteConfig_id_modal_form_nexthop",
            }
        }
    },
    dashlet: function($dashlet) {
        one.lib.dashlet.empty($dashlet);
        var url = one.f.switchmanager.rootUrl + "/staticRoutes";
        one.f.switchmanager.staticRouteConfig.ajax.main(url, {}, function(content) {

            if (content.privilege === 'WRITE') {
                // Add static route button
                var button = one.lib.dashlet.button.single("Add Static Route", one.f.switchmanager.staticRouteConfig.id.dashlet.add, "btn-primary", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {
                    var $modal = one.f.switchmanager.staticRouteConfig.modal.initialize();
                    $modal.modal();
                });
                $dashlet.append(one.lib.dashlet.header(one.f.dashlet.staticRouteConfig.name));
                $dashlet.append($button);

                // Delete static route button
                var button = one.lib.dashlet.button.single("Delete Static Route(s)", one.f.switchmanager.staticRouteConfig.id.dashlet.remove, "btn-danger", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {
                    var requestData = {};
                    var routesToDelete = [];
                    //var checkedCheckBoxes = $("input:checked", $(this).closest(".dashlet").find("table"));
                    var checkedCheckBoxes = $("#" + one.f.switchmanager.staticRouteConfig.id.dashlet.datagrid).find("tbody input:checked");
                    checkedCheckBoxes.each(function(index, value) {
                        routesToDelete.push(checkedCheckBoxes[index].id);
                    });
                    if (checkedCheckBoxes.size() === 0) {
                    	alert('Please select at least one static route');
                    	return false;
                    }
                    if (routesToDelete.length > 0) {
                        requestData["routesToDelete"] = routesToDelete.toString();
                        var url = one.f.switchmanager.rootUrl + "/staticRoute/delete";
                        one.f.switchmanager.staticRouteConfig.ajax.main(url, requestData, function(response) {
                            if (response.status == true) {
                                // refresh dashlet by passing dashlet div as param 
                                one.lib.alert("Static Routes(s) successfully removed");
                            } else {
                                one.lib.alert(response.message);
                            }
                            one.f.switchmanager.staticRouteConfig.dashlet($("#left-bottom .dashlet"));
                        });
                    }
                });
                $dashlet.append($button);
            }
            var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.staticRouteConfig.id.dashlet.datagrid, {
                searchable: true,
                filterable: false,
                pagination: true,
                flexibleRowsPerPage: true
                }, "table-striped table-condensed");
            $dashlet.append($gridHTML);
            var dataSource = one.f.switchmanager.staticRouteConfig.data.staticRouteConfigGrid(content);
            $("#" + one.f.switchmanager.staticRouteConfig.id.dashlet.datagrid).datagrid({dataSource: dataSource})
            .on("loaded", function() {
                $("#"+one.f.switchmanager.staticRouteConfig.id.dashlet.selectAll).click(function() {
                    $("#" + one.f.switchmanager.staticRouteConfig.id.dashlet.datagrid).find(':checkbox').prop('checked',
                        $("#"+one.f.switchmanager.staticRouteConfig.id.dashlet.selectAll).is(':checked'));
                });
                $(".staticRoute").click(function(e){
                    if (!$('.staticRoute[type=checkbox]:not(:checked)').length) {
                        $("#"+one.f.switchmanager.staticRouteConfig.id.dashlet.selectAll)
                            .prop("checked",
                          true);
                    } else {
                        $("#"+one.f.switchmanager.staticRouteConfig.id.dashlet.selectAll)
                            .prop("checked",
                         false);
                    }
                    e.stopPropagation();
                });
             });
        });
    },
    // device ajax calls
    ajax : {
        main : function(url, requestData, callback) {
            $.getJSON(url, requestData, function(data) {
                callback(data);
            });
        }
    },
    registry: {},
    modal : {
        initialize: function() {
            var h3 = "Add Static Route";
            var footer = one.f.switchmanager.staticRouteConfig.modal.footer();
            var $modal = one.lib.modal.spawn(one.f.switchmanager.staticRouteConfig.id.modal.modal, h3, "", footer);
            // bind save button
            $('#' + one.f.switchmanager.staticRouteConfig.id.modal.save, $modal).click(function() {
                one.f.switchmanager.staticRouteConfig.modal.save($modal);
            });
            var $body = one.f.switchmanager.staticRouteConfig.modal.body();
            one.lib.modal.inject.body($modal, $body);
            return $modal;
        },
        save: function($modal) {
            var result = {};
            result['routeName'] = $('#' + one.f.switchmanager.staticRouteConfig.id.modal.form.routeName, $modal).val();
            result['staticRoute'] = $('#' + one.f.switchmanager.staticRouteConfig.id.modal.form.staticRoute, $modal).val();
            result['nextHop'] = $('#' + one.f.switchmanager.staticRouteConfig.id.modal.form.nextHop, $modal).val();
            one.f.switchmanager.staticRouteConfig.modal.ajax.staticRouteConfig(result, function(response) {
                    if(response.status == true) {
                        $modal.modal('hide');
                        // refresh dashlet by passing dashlet div as param
                        one.f.switchmanager.staticRouteConfig.dashlet($("#left-bottom .dashlet"));
                    } else {
                        // TODO: Show error message in a error message label instead.
                        alert(response.message);
                    }
                });
        },
        body: function() {
            var $form = $(document.createElement('form'));
            var $fieldset = $(document.createElement('fieldset'));
            // static route name
            var $label = one.lib.form.label("Name");
            var $input = one.lib.form.input("Name");
            $input.attr('id', one.f.switchmanager.staticRouteConfig.id.modal.form.routeName);
            $fieldset.append($label).append($input);
            // static route IP Mask 
            var $label = one.lib.form.label("Static Route");
            var $input = one.lib.form.input("Static Route");
            $input.attr('id', one.f.switchmanager.staticRouteConfig.id.modal.form.staticRoute);
            $fieldset.append($label).append($input);
            // static route IP Mask 
            var $label = one.lib.form.label("Next Hop");
            var $input = one.lib.form.input("Next Hop");
            $input.attr('id', one.f.switchmanager.staticRouteConfig.id.modal.form.nextHop);
            $fieldset.append($label).append($input);
            // return
            $form.append($fieldset);
            return $form;
        },
        ajax: {
            staticRouteConfig: function(requestData, callback) {
                $.getJSON(one.f.switchmanager.rootUrl + "/staticRoute/add", requestData, function(data) {
                    callback(data);
                });
            }
        },
        data : {
            
        },
        footer : function() {
            var footer = [];
            var saveButton = one.lib.dashlet.button.single("Save", one.f.switchmanager.staticRouteConfig.id.modal.save, "btn-success", "");
            var $saveButton = one.lib.dashlet.button.button(saveButton);
            footer.push($saveButton);
            return footer;
        }
    },
    // data functions
    data : {
        staticRouteConfigGrid: function(data) {
            var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'selector',
                            label: "<input type='checkbox'  id='"
                                +one.f.switchmanager.staticRouteConfig.id.dashlet.selectAll+"'/>",
                            sortable: false
                        },
                        {
                            property: 'name',
                            label: 'Name',
                            sortable: true
                        },
                        {
                            property: 'staticRoute',
                            label: 'Static Route',
                            sortable: true
                        },
                        {
                            property: 'nextHop',
                            label: 'Next Hop Address',
                            sortable: true
                        }
                    ],
                    data: data.nodeData,
                    formatter: function(items) {
                        $.each(items, function(index, item) {
                            item["selector"] = '<input type="checkbox" class="staticRoute" id=' + item["name"] + '></input>';
                        });

                    },
                    delay: 0
                });
            return source;              
        },
        staticRouteConfig : function(data) {
            var result = [];
            $.each(data.nodeData, function(key, value) {
                var tr = {};
                // fill up all the td's
                var entry = [];
                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                checkbox.setAttribute("id", value["name"]);
                entry.push(checkbox);
                entry.push(value["name"]);
                entry.push(value["staticRoute"]);
                entry.push(value["nextHop"]);
                tr.entry = entry;
                result.push(tr);
            });
            return result;
        }
    }
}

one.f.switchmanager.spanPortConfig = {
    id: {
        dashlet: {
            add: "one_f_switchmanager_spanPortConfig_id_dashlet_add",
            remove: "one_f_switchmanager_spanPortConfig_id_dashlet_remove",
            datagrid: "one_f_switchmanager_spanPortConfig_id_dashlet_datagrid",
            selectAllFlows: "one_f_switchmanager_spanPortConfig_id_dashlet_selectAllFlows"
        }, 
        modal: {
            modal: "one_f_switchmanager_spanPortConfig_id_modal_modal",
            save: "one_f_switchmanager_spanPortConfig_id_modal_save",
            form: {
                name : "one_f_switchmanager_spanPortConfig_id_modal_form_name",
                nodes : "one_f_switchmanager_spanPortConfig_id_modal_form_nodes",
                port : "one_f_switchmanager_spanPortConfig_id_modal_form_port",
            }
        }
    },
    dashlet: function($dashlet) {
        one.lib.dashlet.empty($dashlet);
        
        //populate table in dashlet
        var url = one.f.switchmanager.rootUrl + "/spanPorts";
        one.f.switchmanager.spanPortConfig.ajax.main(url, {}, function(content) {

            if (content.privilege === 'WRITE') {

                // Add span port button
                var button = one.lib.dashlet.button.single("Add SPAN Port", one.f.switchmanager.spanPortConfig.id.dashlet.add, "btn-primary", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);

                $button.click(function() {
                    var $modal = one.f.switchmanager.spanPortConfig.modal.initialize();
                    $modal.modal();
                });
                $dashlet.append(one.lib.dashlet.header(one.f.dashlet.spanPortConfig.name));
                $dashlet.append($button);

                // Delete span port button
                var button = one.lib.dashlet.button.single("Delete SPAN Port(s)", one.f.switchmanager.spanPortConfig.id.dashlet.remove, "btn-danger", "btn-mini");
                var $button = one.lib.dashlet.button.button(button);
                $button.click(function() {

                    var checkedCheckBoxes = $("#" + one.f.switchmanager.spanPortConfig.id.dashlet.datagrid).find("tbody input:checked");
                    if (checkedCheckBoxes.length > 0) {
                        var spanPortsToDelete = "";
                        checkedCheckBoxes.each(function(index, value) {
                            spanPortsToDelete += decodeURIComponent(checkedCheckBoxes[index].getAttribute("spanPort")) + "###";
                        });
                        if (checkedCheckBoxes.size() === 0) {
                        	alert('Please select at least one SPAN port');
                        	return false;
                        }

                        var requestData = {};
                        requestData["spanPortsToDelete"] = spanPortsToDelete;
                        var url = one.f.switchmanager.rootUrl + "/spanPorts/delete";
                        one.f.switchmanager.spanPortConfig.ajax.main(url, requestData, function(response) {
                            if (response.status == true) {
                                // refresh dashlet by passing dashlet div as param
                                one.lib.alert("Span Port(s) successfully removed");
                            } else {
                                one.lib.alert(response.message);
                            }
                            one.f.switchmanager.spanPortConfig.dashlet($("#right-bottom .dashlet"));
                        });
                    }
                });
                $dashlet.append($button);
            }
            var $gridHTML = one.lib.dashlet.datagrid.init(one.f.switchmanager.spanPortConfig.id.dashlet.datagrid, {
                searchable: true,
                filterable: false,
                pagination: true,
                flexibleRowsPerPage: true
                }, "table-striped table-condensed");
            $dashlet.append($gridHTML);
            var dataSource = one.f.switchmanager.spanPortConfig.data.spanPortConfigGrid(content);
            $("#" + one.f.switchmanager.spanPortConfig.id.dashlet.datagrid).datagrid({dataSource: dataSource})
            .on("loaded", function() {
                $("#"+one.f.switchmanager.spanPortConfig.id.dashlet.selectAll).click(function() {
                    $("#" + one.f.switchmanager.spanPortConfig.id.dashlet.datagrid).find(':checkbox').prop('checked',
                        $("#"+one.f.switchmanager.spanPortConfig.id.dashlet.selectAll).is(':checked'));
                });
                $(".spanPortConfig").click(function(e){
                    if (!$('.spanPortConfig[type=checkbox]:not(:checked)').length) {
                        $("#"+one.f.switchmanager.spanPortConfig.id.dashlet.selectAll)
                            .prop("checked",
                          true);
                    } else {
                        $("#"+one.f.switchmanager.spanPortConfig.id.dashlet.selectAll)
                            .prop("checked",
                         false);
                    }
                    e.stopPropagation();
                });
             });
        });
    },
    // device ajax calls
    ajax : {
        main : function(url, requestData, callback) {
            $.getJSON(url, requestData, function(data) {
                callback(data);
            });
        }
    },
    registry: {},
    modal : {
        initialize: function() {
            var h3 = "Add SPAN Port";
            var footer = one.f.switchmanager.spanPortConfig.modal.footer();
            var $modal = one.lib.modal.spawn(one.f.switchmanager.spanPortConfig.id.modal.modal, h3, "", footer);
            // bind save button
            $('#' + one.f.switchmanager.spanPortConfig.id.modal.save, $modal).click(function() {
                one.f.switchmanager.spanPortConfig.modal.save($modal);
            });

            one.f.switchmanager.spanPortConfig.modal.ajax.nodes(function(nodes, nodeports) {
                var $body = one.f.switchmanager.spanPortConfig.modal.body(nodes, nodeports);
                one.lib.modal.inject.body($modal, $body);
            });
            return $modal;
        },
        save: function($modal) {
            var result = {};
            result['nodeId'] = $('#' + one.f.switchmanager.spanPortConfig.id.modal.form.nodes, $modal).val();
            result['spanPort'] = $('#' + one.f.switchmanager.spanPortConfig.id.modal.form.port, $modal).val();
            one.f.switchmanager.spanPortConfig.modal.ajax.saveSpanPortConfig(result, 
                function(response) {
                    if(response.status == true) {
                        $modal.modal('hide');
                        one.f.switchmanager.spanPortConfig.dashlet($("#right-bottom .dashlet"));
                    } else {
                        alert(response.message);
                    }
                    
                });
        },
        body: function(nodes, nodeports) {
            var $form = $(document.createElement('form'));
            var $fieldset = $(document.createElement('fieldset'));
            // node
            var $label = one.lib.form.label("Node");
            var $select = one.lib.form.select.create(nodes);
            one.lib.form.select.prepend($select, { '' : 'Please Select a Node' });
            $select.attr('id', one.f.switchmanager.spanPortConfig.id.modal.form.nodes);
            
            // bind onchange
            $select.change(function() {
                // retrieve port value
                var nodeId = $(this).find('option:selected').attr('value');
                one.f.switchmanager.spanPortConfig.registry['currentNode'] = nodeId;
                var $ports = $('#' + one.f.switchmanager.spanPortConfig.id.modal.form.port);
                var ports = one.f.switchmanager.spanPortConfig.registry['nodePorts'][nodeId]
                one.lib.form.select.inject($ports, ports); 
            });

            $fieldset.append($label).append($select);
            // input port
            var $label = one.lib.form.label("Input Port");
            var $select = one.lib.form.select.create();
            $select.attr('id', one.f.switchmanager.spanPortConfig.id.modal.form.port);
            $fieldset.append($label).append($select);
            
            // return
            $form.append($fieldset);
            return $form;
        },
        ajax: {
            nodes: function(callback) {
                $.getJSON(one.f.switchmanager.rootUrl + "/nodeports", function(data) {
                    var nodes = {};
                    var nodePorts = {};
                    $(data).each(function(index, node) {
                        nodes[node.nodeId] = node.nodeName;
                        nodePorts[node.nodeId] = node.nodePorts;
                    });
                    one.f.switchmanager.spanPortConfig.registry['nodePorts'] = nodePorts;
                    callback(nodes, nodePorts);
                });
            },
            saveSpanPortConfig: function(requestData, callback) {
                var resource = {};
                resource["jsonData"] = JSON.stringify(requestData);
                $.getJSON(one.f.switchmanager.rootUrl + "/spanPorts/add", resource, function(data) {
                    callback(data);
                });
            }
        },
        footer : function() {
            var footer = [];
            var saveButton = one.lib.dashlet.button.single("Save", one.f.switchmanager.spanPortConfig.id.modal.save, "btn-success", "");
            var $saveButton = one.lib.dashlet.button.button(saveButton);
            footer.push($saveButton);
            return footer;
        }
    },
    // data functions
    data : {
        spanPortConfigGrid: function(data) {
            var source = new StaticDataSource({
                    columns: [
                        {
                            property: 'selector',
                            label: "<input type='checkbox'  id='"
                                +one.f.switchmanager.spanPortConfig.id.dashlet.selectAll+"'/>",
                            sortable: false
                        },
                        {
                            property: 'nodeName',
                            label: 'Node',
                            sortable: true
                        },
                        {
                            property: 'spanPort',
                            label: 'SPAN Port',
                            sortable: true
                        },
                    ],
                    data: data.nodeData,
                    formatter: function(items) {
                        $.each(items, function(index, item) {
                            item["selector"] = '<input type="checkbox" class="spanPortConfig" spanPort=' + encodeURIComponent(item["json"]) + '></input>';
                        });
                    },
                    delay: 0
                });
            return source;              
        },
        devices : function(data) {
            var result = [];
            $.each(data.nodeData, function(key, value) {
                var tr = {};
                // fill up all the td's
                var entry = [];
                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                checkbox.spanPort = value.json;
                entry.push(checkbox);
                entry.push(value["nodeName"]);
                entry.push(value["spanPort"]);
                tr.entry = entry;
                result.push(tr);
            });
            return result;
        }
    }
}

/** INIT **/
// populate nav tabs
$(one.f.menu.left.top).each(function(index, value) {
    var $nav = $(".nav", "#left-top");
    one.main.page.dashlet($nav, value);
});

$(one.f.menu.left.bottom).each(function(index, value) {
    var $nav = $(".nav", "#left-bottom");
    one.main.page.dashlet($nav, value);
});

$(one.f.menu.right.bottom).each(function(index, value) {
    var $nav = $(".nav", "#right-bottom");
    one.main.page.dashlet($nav, value);
});

one.f.addPopOut = function() {
    $img1 = $(document.createElement("img"));
    $img1.attr("src", "/img/Expand16T.png");
    $img1.attr("style", "float: right;");
    $img1.hover(function() {
        $img1.css("cursor", "pointer");
    });
    $img1.click(function() {
        var $modal = one.f.switchmanager.nodesLearnt.modal.initialize.popout();
        $modal.css({
            'margin-left': '-45%',
            'margin-top': '-3%',
            'width':$(document).width() * 0.8,
            'height':$(document).height() * 0.9
        });
        $(".modal-body", $modal).css({
            "max-height": $(document).height() * 0.75,
        });
        $modal.modal();
    });
    $dash1 = $($("#left-top .nav")[0]);
    $dash1.append($img1);
};
one.f.addPopOut();

// bind dashlet nav
$('.dash .nav a', '#main').click(function() {
    // de/activation
    var $li = $(this).parent();
    var $ul = $li.parent();
    one.lib.nav.unfocus($ul);
    $li.addClass('active');
    // clear respective dashlet
    var $dashlet = $ul.parent().find('.dashlet');
    one.lib.dashlet.empty($dashlet);

    // callback based on menu
    var id = $(this).attr('id');
    var menu = one.f.dashlet;
    switch (id) {
        case menu.nodesLearnt.id:
            one.f.switchmanager.nodesLearnt.dashlet($dashlet);
            break;
        case menu.staticRouteConfig.id:
            one.f.switchmanager.staticRouteConfig.dashlet($dashlet);
            break;
        case menu.subnetGatewayConfig.id:
            one.f.switchmanager.subnetGatewayConfig.dashlet($dashlet);
            break;
        case menu.spanPortConfig.id:
            one.f.switchmanager.spanPortConfig.dashlet($dashlet);
            break;
    };
});

// activate first tab on each dashlet
$('.dash .nav').each(function(index, value) {
    $($(value).find('li')[0]).find('a').click();
});
