    var locations = [
      {title: 'Shanghai', location: {lat: 31.230416, lng: 121.473701}},
      {title: 'Suzhou', location: {lat: 31.298979, lng: 120.58529}},
      {title: 'Wuxi', location: {lat: 31.49117, lng: 120.31191}},
      {title: 'Changzhou', location: {lat: 31.811226, lng: 119.974062}},
      {title: 'Hangzhou', location: {lat: 30.274085, lng: 120.15507}},
      {title: 'Huzhou', location: {lat: 30.894348, lng: 120.086823}}, 
      {title: 'Jiaxing', location: {lat: 30.753924, lng: 120.758543}},
      {title: 'Nantong', location: {lat: 31.980172, lng: 120.894291}},
      {title: 'Yangzhou', location: {lat: 32.394213, lng: 119.412947}},
      {title: 'Zhenjiang', location: {lat: 32.187849, lng: 119.425836}},
    ];

    var styles = [
      {
        featureType: 'water',
        stylers: [
          { color: '#19a0d8' }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
          { color: '#ffffff' },
          { weight: 6 }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [
          { color: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -40 }
        ]
      },{
        featureType: 'transit.station',
        stylers: [
          { weight: 9 },
          { hue: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
          { visibility: 'off' }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
          { lightness: 100 }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          { lightness: -100 }
        ]
      },{
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          { visibility: 'on' },
          { color: '#f0e4d3' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -25 }
        ]
      }
    ];


    $(document).ready(function () {
       ko.applyBindings(new ViewModel());
    });

    var ViewModel = function(){
        var self = this; 

        var menu= document.querySelector("#menu");
        var drawer = document.querySelector(".options-box1");
        var mapClick = document.querySelector("#map")
            menu.addEventListener("click", function (e) {
                drawer.classList.toggle("open"); 
                e.stopPropagation(); 
            } );

        mapClick.addEventListener('click', function() {
            drawer.classList.remove('open');
        });  


        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 31.298979, lng: 120.58529},
          zoom: 8,
          styles: styles,
          mapTypeControl: false
        });

      this.markers = ko.observableArray([]); 
      this.searchInput = ko.observable(""); 

      this.Infowindow = new google.maps.InfoWindow();
      var Infowindow = this.Infowindow; 

      for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title; 
        
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|9A32CD", 
        });

        marker.showItem = ko.observable(true);

        this.markers.push(marker); 

        this.bounce = function(marker) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function () {
              marker.setAnimation(null);
          }, 1300);
        };

         marker.addListener('click', (function(marker,Infowindow){
          return function(){
            self.populateInfoWindow(marker, Infowindow);
            self.bounce(this);
          };
        }(marker,Infowindow))); 

          marker.addListener('mouseover', function() {
            this.setIcon("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFFF00");
          });
          marker.addListener('mouseout', function() {
            this.setIcon("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|9A32CD");
          });

        marker.setMap(map);
      }

      this.filter = ko.pureComputed({
          read: function() {
            return self.searchInput();
            },
          write: function(value) {
            for (var i in self.markers()) {
              if(self.markers()[i].title.toLowerCase().indexOf(self.searchInput().toLowerCase()) >= 0) {
                self.markers()[i].showItem(true);
                self.markers()[i].setVisible(true);                
              } else {
                self.markers()[i].showItem(false);
                self.markers()[i].setVisible(false);
              }
            }
          }
        });

      this.populateInfoWindow = function(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          infowindow.marker = marker;
          infowindow.setContent('<div id="wikipedia-links">' + '</div>');
          self.loadData(marker); 
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
        }
      };


      this.loadData = function(marker) {
          var $wikiElem = $('#wikipedia-links');
          // clear out old data before new request
          $wikiElem.text("");

      var wikiUrl = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + marker.title + "&format=json&callback=wikiCallback";
      var wikiRequestTimeout = setTimeout(function(){
          $wikiElem.text("Failed to get wikipedia resources"); 
      }, 2000); 


      $.ajax({
          url:wikiUrl,
          dataType: "jsonp", 
          success: function(response){
              var articleList = response[1];
              var cityName = response[0];
              $wikiElem.append('<h3>' + "What's in " + cityName + '</h3>');    
              for(var i=0; i<articleList.length; i++){
                  articleStr = articleList[i];
                  var url = 'http://en.wikipedia.org/wiki/'+articleStr; 
                  $wikiElem.append('<li><a href="'+ url +'"> '+ articleStr + '</a></li>');
              }
              clearTimeout(wikiRequestTimeout); 
          }
      });

      };


    }; 




