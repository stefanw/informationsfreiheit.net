(function(){

    var FoiFinder = function(){
        this.ready = false;
        this.callbackOnReady = false;
        this.foilaws = null;
    };

    FoiFinder.prototype.init = function(){
        var self = this;
        $.getJSON('foilaws.json', function(data){
            console.log(data);
            self.foilaws = data.laws;
            self.ready = true;
            if (self.callbackOnReady) {
                self.callbackOnRead();
            }
        });
    };

    FoiFinder.prototype.findAll = function(adr, clb){
        if (!this.ready){
            this.callbackOnReady = FoiFinder.prototype.findAll;
            return;
        }
        var foilaw;
        var result = [[], [], []];
        for (var i = 0; i < this.foilaws.length; i += 1){
            foilaw = this.foilaws[i];
            if (adr.country === foilaw.country && adr.state === foilaw.state &&
                    adr.city.indexOf(foilaw.city) !== -1){
                result[2].push(foilaw);
            } else if (adr.country === foilaw.country && adr.state == foilaw.state && foilaw.city === null){
                result[1].push(foilaw);
            } else if (adr.country === foilaw.country && foilaw.state === null) {
                result[0].push(foilaw);
            }
        }
        clb(result);
    };

    if (!navigator.geolocation) {
        $("#geoavailable").remove();
    }
    var geocoder = new google.maps.Geocoder();
    var foifinder = new FoiFinder();
    foifinder.init();
    var renderTable = function(result){
        var output = "", laws,
            missing = ['<p>Kein Informationsgesetz auf Bundesebene bekannt</p>', '<p>Kein Informationsgesetz auf Landesebene bekannt</p>',
                '<p>Kein Informationsfreiheitssatzung auf Kommunalebene bekannt</p>'];

            exists = ['<h3>Informationsgesetze auf Bundesebene</h3>', '<h3>Informationsgesetze auf Landesebene</h3>',
                '<h3>Informationsfreiheitssatzung auf Kommunalebene</h3>'];

        for (var k = 0; k < result.length; k += 1){
            laws = result[k];
            if (laws.length > 0){
                output+= exists[k];
                output += "<table>";
                for (var i = 0; i < laws.length; i += 1){
                    var law = laws[i];
                    var name = law.name || "Informationsfreiheits-Satzung";
                    var url = law.url;
                    var loc = law.city;
                    country = law.country;
                    loc = loc ? loc + ", " + law.state : law.state;
                    loc = loc ? loc + ", " + country : country;
                    output += '<tr><td><a href="'+url+'">'+name+'</a></td>';
                    output += '<td>' + loc + '</td>';
                    desc = law.description;
                    if (law.foisite){
                        if (desc){
                            desc += "<br/>";
                        }
                        desc += '<a href="' + law.foisite + '">Anfrage online stellen</a>';
                    }
                    output += '<td>' + desc + '</td></tr>';
                }
                output += "</table>";
            } else {
                output += missing[k];
            }
        }
        $("#result").html(output);
    };
    var findFoiLaw = function(results, status){
        var ac;
        if (status == google.maps.GeocoderStatus.OK) {
            $("#you-are-here").text(results[0].formatted_address);
            console.log(results);
            ac = results[0].address_components;
            var address = {
                country: "",
                city: "",
                state: ""
            };
            for (var i = 0; i < ac.length; i += 1){
                if(ac[i].types[0] === "locality"){
                    address.city = ac[i].long_name;
                } else if(ac[i].types[0] === "administrative_area_level_1"){
                    address.state = ac[i].long_name;
                } else if(ac[i].types[0] === "country"){
                    address.country = ac[i].long_name;
                }
            }
            foifinder.findAll(address, renderTable);
        }
    };
    var findByPosition = function(lat, lng){
        geocoder.geocode({'latLng': new google.maps.LatLng(lat, lng)}, function(results, status){
            if (status == google.maps.GeocoderStatus.OK) {
                $("#address").val(results[0].formatted_address);
                $("#geocodeme").click();
            }
        });
    };
    var findByAddress = function(address){
        geocoder.geocode({'address': address}, findFoiLaw);
    };
    $("#geolocateme").click(function(e){
        e.preventDefault();
        navigator.geolocation.getCurrentPosition(function(position) {
            findByPosition(position.coords.latitude, position.coords.longitude);
        });
    });
    $("#geocodeme").click(function(){
        findByAddress($("#address").val());
    });
    
    if (window.location.href.indexOf("?") !== -1) {
        var search = window.location.href;
        search = search.slice(window.location.href.indexOf('?') + 1);
        var keyvalues = search.split("&"), vars = {};
        for(var i = 0; i < keyvalues.length; i += 1) {
            var hash = keyvalues[i].split('=');
            vars[hash[0]] = hash[1];
        }
        if (vars['adresse'] !== undefined){
            var address = decodeURIComponent(vars['adresse']);
            address = address.replace(/\+/g, ' ');
            $("#address").val(address);
            findByAddress(address);
        }
    }
}());
