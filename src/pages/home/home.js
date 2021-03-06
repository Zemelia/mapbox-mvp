import ReactDOM from "react-dom";
import PropTypes from 'prop-types';
import React, {useRef, useEffect, useState} from "react";
import mapboxgl from "mapbox-gl";
import labelLayerId, {popup} from './../../config'

import Popup from "../../components/popup/popup";

const Home = ({features, layerOptions, setPointItem}) => {
	const [map, setMap] = useState(null);
	const mapContainer = useRef(null);
	const popUpRef = useRef(new mapboxgl.Popup({offset: 15}));


	useEffect(() => {
		if (!map) {
      console.log('sss');
      // We should proceed this inly once.
      let mapObject = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-74.00555714964867, 40.71331846247975],
        zoom: 15.5,
        pitch: 45,
        bearing: -17.6,
        antialias: true,
    }, []);
    mapObject.on("load", () => {
                setMap(mapObject);
                mapObject.addLayer(layerOptions, labelLayerId(mapObject));
                mapObject.addSource('pointsSource', {
                    type: "geojson",
                    data: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                });

                mapObject.addLayer({
                    id: "points",
                    source: "pointsSource",
                    type: "circle",
                    paint: {
                        'circle-radius': 10,
                        'circle-color': 'skyblue'
                    }
                });
            });
            mapObject.on('mouseenter', 'points', e => {
              mapObject.getCanvas().style.cursor = 'pointer';
                const result = mapObject.queryRenderedFeatures(e.point, {layers: ['points']});
                let coordinates = result[0].geometry.coordinates;
                let description = result[0].properties.description;
                let title = result[0].properties.title;

                let resInfoPopup = `<h1>${title}</h1><h3>${description}</h3>`;

                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                popup
                    .setLngLat(coordinates)
                    .setHTML(resInfoPopup)
                    .addTo(mapObject);
            });
            mapObject.on('mouseleave', 'points', () => {
              mapObject.getCanvas().style.cursor = '';
                popup.remove();
            });
            mapObject.on('click', '3d-buildings', (e) => {
                const resultBuilds = mapObject.queryRenderedFeatures(e.point, {layers: ['3d-buildings']});

                if (resultBuilds.length) {
                    const popupNode = document.createElement("div");
                    ReactDOM.render(<Popup addPoint={setPointItem} lngLat={e.lngLat}/>, popupNode);
                    popUpRef.current
                        .setLngLat(e.lngLat)
                        .setDOMContent(popupNode)
                        .addTo(mapObject);
                }
            });
        }

  }, [map, layerOptions, setPointItem]);

  useEffect(() => {
    if (map && map.getSource('pointsSource')) {
      map.getSource('pointsSource').setData({
        type: 'FeatureCollection',
        features: features,
      });
      popUpRef.current.remove();
    }
  }, [features, map]);


	return <div className="map-container" ref={mapContainer}/>;
};

Home.propTypes = {
	features: PropTypes.array.isRequired,
	layerOptions: PropTypes.object.isRequired,
	setPointItem: PropTypes.func.isRequired,
};

export default Home;
