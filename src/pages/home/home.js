import ReactDOM from "react-dom";
import PropTypes from 'prop-types';
import React, {useRef, useEffect} from "react";
import mapboxgl from "mapbox-gl";
import labelLayerId, { popup } from './../../config'

import Popup from "../../components/popup/popup";

const Home = ({ features, layerOptions, setPointItem }) => {

	const mapContainerRef = useRef(null);
	const popUpRef = useRef(new mapboxgl.Popup({offset: 15}));

	useEffect(() => {
		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/light-v10',
			center: [-74.00555714964867, 40.71331846247975],
			zoom: 15.5,
			pitch: 45,
			bearing: -17.6,
			antialias: true,
		}, []);

		map.on("load", () => {
			map.addSource('pointsSource', {
				type: "geojson",
				data: {
					type: 'FeatureCollection',
					features: features,
				},
			});
			map.addLayer({
				id: "points",
				source: "pointsSource",
				type: "circle",
				paint: {
					'circle-radius': 10,
					'circle-color': 'skyblue'
				}
			});
			map.addLayer(layerOptions, labelLayerId(map));
		});
		map.on("moveend", async (e) => {
			// fetch new data
			const results = await features;
			map.getSource('pointsSource').setData(results);
		});
		map.on('mouseenter', 'points', e => {
			map.getCanvas().style.cursor = 'pointer';
			const result = map.queryRenderedFeatures(e.point, {layers: ['points']})
			let coordinates = result[0].geometry.coordinates;
			let description = result[0].properties.description;
			let title = result[0].properties.title;

			let resInfoPopup = `<h1>${ title }</h1><h3>${description}</h3>`

			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}
			popup
				.setLngLat(coordinates)
				.setHTML(resInfoPopup)
				.addTo(map);
		});
		map.on('mouseleave', 'points', () => {
			map.getCanvas().style.cursor = '';
			popup.remove();
		});
		map.on('click', '3d-buildings', (e) => {
			const resultBuilds = map.queryRenderedFeatures(e.point, {layers: ['3d-buildings']})

			if (resultBuilds.length) {
				const popupNode = document.createElement("div");
				ReactDOM.render(<Popup addPoint={setPointItem} lngLat={e.lngLat}/>, popupNode);
				popUpRef.current
					.setLngLat(e.lngLat)
					.setDOMContent(popupNode)
					.addTo(map);
			}
		});
		// clean up on unmount
		return () => map.remove();
	}, [features, setPointItem, layerOptions]);

	return <div className="map-container" ref={mapContainerRef}/>;
};

Home.propTypes = {
	features: PropTypes.array.isRequired,
	layerOptions: PropTypes.object.isRequired,
};

export default Home;