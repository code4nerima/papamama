/**
 * 保育所背景リスト
 * @type {Object}
 */
var featureStyleList = {
	'default': { color: 'rgba(153, 153, 153, 1)', img: 'image/018.png'},
	'認可外保育施設': { color: '#0362A0', img: 'image/019.png'},
	'幼稚園': { color: '#FF5C24', img: 'image/029.png'},
	'私立認可保育園': { color: '#6EE100', img: 'image/018.png'},
	'区立認可保育園': { color: '#44AA00', img: 'image/018.png'},
	'認証保育所': { color: '#0488EE', img: 'image/018.png'},
	'小規模・事業所内保育事業': { color: '#6DBA9C', img: 'image/018.png'},
	'障害児通所支援事業': { color: '#f78cb7', img: 'image/029.png'}
};

/**
 * 私立認可保育所向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var priNinkaStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "私立認可保育園") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 公立認可保育所向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var pubNinkaStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "区立認可保育園") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 認可外保育所向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var ninkagaiStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "認可外保育施設") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 幼稚園向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var kindergartenStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "幼稚園") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 認証向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var ninsyouStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "認証保育所") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 小規模・事業所内保育事業向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var jigyoshoStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "小規模・事業所内保育事業") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 障害児通所支援事業向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var disabilityStyleFunction = function(feature, resolution)
{
	var facilityTypeName = feature.get('種別') ? feature.get('種別') : feature.get('Type');
	var style = [];
	if(facilityTypeName === "障害児通所支援事業") {
		featureStyle = featureStyleList[facilityTypeName];
		style        = nurseryStyleFunction(feature, resolution, featureStyle);
	}
	return style;
};

/**
 * 保育施設共通のスタイル定義
 * @param  {[type]} feature      [description]
 * @param  {[type]} resolution   [description]
 * @param  {[type]} featureStyle [description]
 * @return {[type]}              [description]
 */
var nurseryStyleFunction = function(feature, resolution, featureStyle) {
	var radius = 15;
	var background = new ol.style.Circle({
		radius: radius,
		fill: new ol.style.Fill({
			color: featureStyle.color
		}),
		stroke: new ol.style.Stroke({color: 'white', width: 3})
	});
	var image = new ol.style.Icon({
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: featureStyle.img,
		scale: 0.5
	});

	resolution = Math.floor(resolution * 1000);
	var _type = "";
	var label = feature.get('ラベル') ? feature.get('ラベル') : feature.get('Label');
	var text = resolution < 10000 ? label : '';
	var style = [];
	style = [
		new ol.style.Style({image: background}),
		new ol.style.Style({image: image}),
	];

	if (text !== "") {
		style.push(
			new ol.style.Style({
				text: new ol.style.Text({
					offsetY: -20.0,
					text: text,
					font: '14px sans-serif',
					fill: new ol.style.Fill({
						color: '#000'
					}),
					stroke: new ol.style.Stroke({
						color: '#FFF',
						width: 3
					})
				})
			})
		);
	}
	return style;
};

/**
 * ベースの校区スタイルを戻す関数
 * @param  {[type]} mojicolor [description]
 * @param  {[type]} fillcolor [description]
 * @return {[type]}           [description]
 */
function baseSchoolStyle(mojicolor, fillcolor) {
	return function(feature, resolution) {
		var image = new ol.style.Icon({
			anchor: [0.5, 0.5],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction',
			src: 'image/school.png',
			// scale: 0.5
		});

		var background = new ol.style.Circle({
			radius: 15,
			fill: new ol.style.Fill({
				color: mojicolor
			}),
			stroke: new ol.style.Stroke({color: 'white', width: 3})
		});

		var style = [
			new ol.style.Style({image: background}),
			new ol.style.Style({image: image}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: mojicolor,
					width: 3
				}),
				fill: new ol.style.Fill({
					color: fillcolor
				})
			})
		];

		resolution = Math.floor(resolution * 1000);
		var text = "";
		if(feature.get('label') !== null) {
			text = resolution < 12000 ? feature.get('label') : '';
		}
		if (text !== "") {
			style.push(
					new ol.style.Style({
						text: new ol.style.Text({
							offsetY: -25.0,
							text: text,
							font: '13px sans-serif',
							fill: new ol.style.Fill({
								color: mojicolor
							}),
							stroke: new ol.style.Stroke({
								color: '#FFF',
								width: 3
							})
						})
					})
				);
		}
		return style;
	};
}

// 中学校区スタイル
var middleSchoolStyleFunction = baseSchoolStyle(
	'#7379AE', 'rgba(115, 121, 174, 0.1)'
	);

// 小学校区スタイル
var elementaryStyleFunction = baseSchoolStyle(
	'#1BA466', 'rgba(27, 164, 102, 0.1)'
	);

// 距離計測用同心円の色設定
var circleStyleFunction = function(feature, resolution) {
	resolution = Math.floor(resolution * 1000);
	var text = "";
	if(feature.get('name') !== null) {
		text = resolution < 100000 ? feature.get('name') : '';
	}
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(238, 149, 44, 0.30)',
			width: 3
		}),
		fill: new ol.style.Fill({
			color: 'rgba(238, 149, 44, 0.30)'
		}),
		text: new ol.style.Text({
			offsetY: -40.0,
			text: text,
			font: '20px sans-serif',
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: '#FFF',
				width: 3
			})
		})
	})];
	return style;
};
