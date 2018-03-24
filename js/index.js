// 地図表示時の中心座標
var init_center_coords = [139.618728,35.748973];

// Bing APIのキー
var bing_api_key = 'Ap-kk3eox-rGrZ07nFRNVGWy6BlbbkhXeXi-TwvOuIcltcoLsuEsEoBEWmVTWHOe';

// map
var map;

// 保育施設JSON格納用オブジェクト
var nurseryFacilities = {};

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// マップサーバ一覧
var mapServerList = {
	'bing-road': {
		label: "標準(Bing)",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Road',
		})
	},
	"cyberjapn-pale": {
		label: "国土地理院",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "交通",
		source_type: "osm",
		source: new ol.source.OSM({
			url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
			attributions: [
				ol.source.OSM.DATA_ATTRIBUTION,
				new ol.Attribution({html: "Tiles courtesy of <a href='http://www.thunderforest.com/' target='_blank'>Andy Allan</a>"})
			]
		})
	},
	'bing-aerial': {
		label: "写真",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Aerial',
		})
	}
};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
 function resizeMapDiv() {
 	var screenHeight = $.mobile.getScreenHeight();
 	// var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
 	// var contentHeight = screenHeight - contentCurrentHeight;
 	// var navHeight = $("#nav1").outerHeight();
 	// $(".ui-content").height(contentHeight);
 	$(".ui-content").height(screenHeight);
 	$("#map").height(screenHeight);
 	// $("#map").height(contentHeight - navHeight);
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});


$('#mainPage').on('pageshow', function() {
	resizeMapDiv();

	// 地図レイヤー定義
	var papamamap = new Papamamap();
	papamamap.viewCenter = init_center_coords;
	papamamap.generate(mapServerList['bing-road']);
	map = papamamap.map;

	// 保育施設の読み込みとレイヤーの追加
	papamamap.loadNurseryFacilitiesJson(function(data){
		nurseryFacilities = data;
	}).then(function(){
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
	});

	// ポップアップ定義
	var popup = new ol.Overlay({
		element: $('#popup')
	});
	map.addOverlay(popup);

	// 背景地図一覧リストを設定する
	for(var item in mapServerList) {
		option = $('<option>').html(mapServerList[item].label).val(item);
		$('#changeBaseMap').append(option);
	}

	// 最寄駅セレクトボックスの生成
	mtl = new MoveToList();
	mtl.loadStationJson().then(function() {
		mtl.appendToMoveToListBox(moveToList);
	}, function(){
		mtl.loadStationJson().then(function() {
			mtl.appendToMoveToListBox(moveToList);
		});
	});

	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		if ( $('#popup').is(':visible') ) {
			// ポップアップを消す
			$('#popup').hide();
			return;
		}

		// クリック位置の施設情報を取得
		obj = map.forEachFeatureAtPixel(
			evt.pixel,
			function(feature, layer) {
				return {feature: feature, layer: layer};
			}
		);

		var feature = null;
		var layer   = null;
		var coord		= null;
		if(obj !== undefined) {
			feature = obj.feature;
			layer   = obj.layer;
		}
		// クリックした場所に要素がなんにもない場合、クリック位置に地図の移動を行う
		if (feature === null) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			papamamap.animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);
		}

		// クリックした場所に既に描いた同心円がある場合、円を消す
		if (feature && layer.get('name') === 'layerCircle' &&
			feature.getGeometry().getType() === "Polygon") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			clearCenterCircle();
		}

		// クリックした場所に保育施設がある場合、ポップアップダイアログを出力する
		if (feature && "Point" == feature.getGeometry().getType()) {
			var type = feature.get('種別') ? feature.get('種別') :  feature.get('Type');
			if(type === undefined) {
				return;
			}
			var geometry = feature.getGeometry();
			coord = geometry.getCoordinates();
			popup.setPosition(coord);

			// タイトル部
			var title = papamamap.getPopupTitle(feature);
			$("#popup-title").html(title);

			// 内容部
			papamamap.animatedMove(coord[0], coord[1], false);
			var content = papamamap.getPopupContent(feature);
			$("#popup-content").html(content);
			$('#popup').show();
			view = map.getView();
			view.setCenter(coord);
		}
	});

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		// $('#markerTitle').hide();
		// $('#marker').hide();

		//最寄駅をクリックで駅マーカーを非表示にする
		if ($('#moveTo option:selected').text() == "最寄駅"){
			clearMarker();
		} else {
			// 指定した最寄り駅に移動
			papamamap.moveToSelectItem(moveToList[$(this).val()]);

			// 地図上にマーカーを設定する
			var lon = moveToList[$(this).val()].lon;
			var lat = moveToList[$(this).val()].lat;
			var label = moveToList[$(this).val()].name;
			var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
			// Vienna marker
			drawMarker(pos, label);
		}
	});

	// 幼稚園チェックボックスのイベント設定
	$('#cbKindergarten').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 私立認可保育所チェックボックスのイベント設定
	$('#cbPriNinka').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 公立認可保育所チェックボックスのイベント設定
	$('#cbPubNinka').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認証保育所チェックボックスのイベント設定
	$('#cbNinsyou').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認可外保育所チェックボックスのイベント設定
	$('#cbNinkagai').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 小規模・事業所内保育事業チェックボックスのイベント設定
	$('#cbJigyosho').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 障害児通所支援事業チェックボックスのイベント設定
	$('#cbDisability').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 中学校区チェックボックスのイベント定義
	$('#cbMiddleSchool').click(function() {
		layer = map.getLayers().item(1);
		layer.setVisible($(this).prop('checked'));
	});

	// 小学校区チェックボックスのイベント定義
	$('#cbElementarySchool').click(function() {
		layer = map.getLayers().item(2);
		layer.setVisible($(this).prop('checked'));
	});

	// 現在地に移動するボタンのイベント定義
	$('#moveCurrentLocation').click(function(evt){
		control = new MoveCurrentLocationControl();
		control.getCurrentPosition(
			function(pos) {
				var coordinate = ol.proj.transform(
					[pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857');
				view = map.getView();
				view.setCenter(coordinate);
				drawMarker(coordinate, "現在地");
			},
			function(err) {
				alert('位置情報が取得できませんでした。');
			}
		);
	});

	// 半径セレクトボックスのイベント定義
	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			clearCenterCircle();
			$('#cbDisplayCircle').prop('checked', false).checkboxradio('refresh');
			return;
		} else {
			$('#cbDisplayCircle').prop('checked', true).checkboxradio('refresh');
			drawCenterCircle(radius);
		}
	});

	// 円表示ボタンのイベント定義
	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if($('#cbDisplayCircle').prop('checked')) {
			drawCenterCircle(radius);
		} else {
			clearCenterCircle();
		}
	});

	// 地図変更選択ボックス操作時のイベント
	$('#changeBaseMap').change(function(evt) {
		if($(this).val() === "背景") {
			$(this).val($(this).prop("selectedIndex", 1).val());
		}
		papamamap.changeMapServer(
			mapServerList[$(this).val()], $('#changeOpacity option:selected').val()
			);
	});

	// ポップアップを閉じるイベント
	$('#popup-closer').click(function(evt){
		$('#popup').hide();
		return;
	});

	// ポップアップを閉じる
	$('.ol-popup').parent('div').click(function(evt){
		$('#popup').hide();
		return;
	});

	// 親要素へのイベント伝播を停止する
	$('.ol-popup').click(function(evt){
		evt.stopPropagation();
	});

	/*
    $(function(){
        $('a.disable').click(function(){
            return false;
        })
    });
	*/

    // 検索フィルターを有効にする
	$('#filterApply').click(function(evt){
	'use strict';

		// 条件作成処理
		var conditions = {};
		var checkObj = {
			pubNinka: false,
			priNinka: false,
			ninkagai: false,
			yhoiku: false,
			kindergarten: false,
			jigyosho: false,
			disability: false
		};

		// 検索フィルターのセレクト(filtersbクラス)で選択されたもののみ抽出
		$('select.filtersb option:selected').each(function(index,item) {
			if (item.value) conditions[item.parentNode.id] = item.value;
		});
		// 検索フィルターのチェックボックス(filtercbクラス)で選択されたもののみ抽出
		$('.filtercb').each(function(index,item ) {
			if (item.checked) conditions[item .id] = 'Y';
	  });

		// フィルター適用時
		if(Object.keys(conditions).length > 0) {
			var filter = new FacilityFilter();
			checkObj.filterPattern = 0; // Google Analyticsのイベントトラッキングで送信する値のデフォルト値
			var newGeoJson = filter.getFilteredFeaturesGeoJson(conditions, nurseryFacilities, checkObj); // checkObjを参照渡しで表示レイヤーを取得する
			papamamap.addNurseryFacilitiesLayer(newGeoJson);
			$('#btnFilter').css('background-color', '#3388cc');
			// 検索結果の一覧のhtmlを新規タブで表示される。クエリで検索条件を新規Windowへ渡す
			if (document.getElementById("filteredList").checked) {
				var urlQuery = '?';
				Object.keys(conditions).forEach(function(item) {
					urlQuery += item + '=' + conditions[item] + '&';
				});
				urlQuery = urlQuery.slice(0,urlQuery.length-1);
				var urlpath = (location.pathname === '/') ? '/' : location.pathname + '/';
				window.open(location.origin+urlpath+'filteredList.html'+urlQuery);
			}
		} else {
			papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
			$('#btnFilter').css('background-color', '#f6f6f6');
			Object.keys(checkObj).forEach(function(item) {
				checkObj[item] = true;
			});
			checkObj.filterPattern = 0; // Google Analyticsのイベントトラッキングで送信する値
		}

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus(checkObj);

		// ga('send', 'event', 'カテゴリ', 'アクション', 'ラベル', '値', { nonInteraction: 真偽値 } )
 		// *nonInteraction: trueはイベントが発生しても直帰率に影響せず、falseはイベントの呼び出しで直帰とみなされなくなる
 		ga('send', 'event', 'filter', this.id, checkObj.filterPattern) ;
 		// 本イベントを直帰率へ反映させたくない場合は以下を使用すること。
 		// ga('send', 'event', 'nurseryFacilities', 'filter', this.id, checkObj.filterPattern, { nonInteraction: true });

	});

	// 絞込条件のリセット
	$('#filterReset').click(function(evt){
		// チェックボックスをリセット
		$(".filtercb").each(function(){
			$(this).prop('checked', false).checkboxradio('refresh');
		});
		// セレクトボックスをリセット
		$('.filtersb').each(function(){
			$(this).selectmenu(); // これを実行しないと次の行でエラー発生
			$(this).val('').selectmenu('refresh');
		});
		// 施設情報をリセット
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
		$('#btnFilter').css('background-color', '#f6f6f6');

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus({pubNinka: true, priNinka: true, ninsyou: true, ninkagai: true, kindergarten: true, jigyosho: true, disability: true});
	});

	/**
	 * レイヤー状態を切り替える
	 *
	 * @param  {[type]} checkObj [description]
	 * @return {[type]}               [description]
	 */
	function updateLayerStatus(checkObj)
	{
		papamamap.switchLayer($('#cbPriNinka').prop('id'), checkObj.priNinka);
		papamamap.switchLayer($('#cbPubNinka').prop('id'), checkObj.pubNinka);
		papamamap.switchLayer($('#cbNinsyou').prop('id'), checkObj.ninsyou);
		papamamap.switchLayer($('#cbNinkagai').prop('id'), checkObj.ninkagai);
		papamamap.switchLayer($('#cbYhoiku').prop('id'), checkObj.yhoiku);
		papamamap.switchLayer($('#cbKindergarten').prop('id'), checkObj.kindergarten);
		papamamap.switchLayer($('#cbJigyosho').prop('id'), checkObj.jigyosho);
		papamamap.switchLayer($('#cbDisability').prop('id'), checkObj.disability);
		$('#cbPriNinka').prop('checked', checkObj.priNinka).checkboxradio('refresh');
		$('#cbPubNinka').prop('checked', checkObj.pubNinka).checkboxradio('refresh');
		$('#cbNinsyou').prop('checked', checkObj.ninsyou).checkboxradio('refresh'	);
		$('#cbNinkagai').prop('checked', checkObj.ninkagai).checkboxradio('refresh'	);
		$('#cbYhoiku').prop('checked', checkObj.yhoiku).checkboxradio('refresh');
		$('#cbKindergarten').prop('checked', checkObj.kindergarten).checkboxradio('refresh');
		$('#cbJigyosho').prop('checked', checkObj.jigyosho).checkboxradio('refresh');
		$('#cbDisability').prop('checked', checkObj.disability).checkboxradio('refresh');
	}

	/**
	 * 円を描画する 関数内関数
	 *
	 * @param  {[type]} radius    [description]
	 * @return {[type]}           [description]
	 */
	function drawCenterCircle(radius)
	{
		if($('#cbDisplayCircle').prop('checked')) {
			papamamap.drawCenterCircle(radius);

			$('#center_markerTitle').hide();
			$('#center_marker').hide();

			var center = map.getView().getCenter();
			var coordinate = center;
			var marker = new ol.Overlay({
				position: coordinate,
				positioning: 'center-center',
				element: $('#center_marker'),
				stopEvent: false
			});
			map.addOverlay(marker);

			// 地図マーカーラベル設定
			$('#center_markerTitle').html("");
			var markerTitle = new ol.Overlay({
				position: coordinate,
				element: $('#center_markerTitle')
			});
			map.addOverlay(markerTitle);
			$('#center_markerTitle').show();
			$('#center_marker').show();
		}
	}

	/**
	 * 円を消す
	 *
	 * @return {[type]} [description]
	 */
	function clearCenterCircle()
	{
		papamamap.clearCenterCircle();
		$('#center_markerTitle').hide();
		$('#center_marker').hide();
		$('#changeCircleRadius').val('').selectmenu('refresh');
		return;
	}

	/**
	 * 指定座標にマーカーを設定する
	 * @param  {[type]} coordinate [description]
	 * @return {[type]}            [description]
	 */
	function drawMarker(coordinate, label)
	{
		$('#markerTitle').hide();
		$('#marker').hide();
		var marker = new ol.Overlay({
			position: coordinate,
			positioning: 'center-center',
			element: $('#marker'),
			stopEvent: false
		});
		map.addOverlay(marker);

		// 地図マーカーラベル設定
		$('#markerTitle').html(label);
		var markerTitle = new ol.Overlay({
			position: coordinate,
			element: $('#markerTitle')
		});
		map.addOverlay(markerTitle);
		$('#markerTitle').show();
		$('#marker').show();
		return;
	}

	/**
	 * 指定座標のマーカーを非表示にする
	 */
	 function clearMarker() {
		 $('#markerTitle').hide();
		 $('#marker').hide();
	 }

	  // メニューボタンをクリックした時のイベントの登録
		document.getElementById('nav1-btn').addEventListener('click', function (event) {
	 	 	var elem = document.getElementsByClassName("nav1-li");
			if (elem[0].style.display === "none") {
				elem[0].style.display ="inline-block";
				elem[1].style.display ="inline-block";
			} else {
				elem[0].style.display ="none";
				elem[1].style.display ="none";
			}

 	 });

   // メニューバーとロゴをWindowサイズに合わせて配置を変更する
	 var toggleNavbar = function () {

		  // マップのサイズを画面サイズに調整
		  resizeMapDiv();

		 	var elem = document.getElementsByClassName("nav1-li");
			document.getElementById("nav1").style.top = "0px";
			document.getElementById("nav1").style.left = "50px";
			Object.keys(elem[0].children).forEach(function(item){
				elem[0].children[item].style.width = "";
			});
			["btnFilter", "changeBaseMap-button", "moveTo-button", "changeCircleRadius-button", "btnHelp"].forEach(function(e) {
				document.getElementById(e).style.width = "";
			});
		 	elem[0].style.display ="inline-block";
			elem[1].style.display ="inline-block";
			var btn = document.getElementById("nav1-btn-div");
			btn.style.display = "none";

			var logo = document.getElementById("map-logo");
			logo.style.left = window.innerWidth / 2 - 115 + "px";
			// Windowサイズがメニューの幅より小さい場合(つまりメニューが複数行となる場合)
		 	if (elem[0].clientHeight > 50) {
		 		elem[0].style.display ="none";
				elem[1].style.display ="none";
				btn.style.display = "block";
				logo.style.top = "0";
				logo.style.height = "0";
				logo.style.bottom = "";
				Object.keys(elem[0].children).forEach(function(i){
					elem[0].children[i].style.width =  (window.innerWidth / 3 * 1) + "px";
				});
				["btnFilter", "changeBaseMap-button", "moveTo-button", "changeCircleRadius-button", "btnHelp"].forEach(function(e) {
					document.getElementById(e).style.width = (window.innerWidth / 3 * 1) + "px";
				});
				document.getElementById("nav1").style.top = (btn.clientHeight - 5) + "px";
				if (window.innerHeight > 580) {
						document.getElementById("nav1").style.left = (window.innerWidth / 3 * 2 - 5) + "px";
				} else {
						document.getElementById("nav1").style.left = (window.innerWidth / 3 * 1 - 5) + "px";
				}
			// Windowサイズがメニューの幅より大きい場合
		 	} else {
		 		elem[0].style.display ="inline-block";
				elem[1].style.display ="inline-block";
				btn.style.display = "none";
				logo.style.top = "";
				logo.style.bottom = "30px";
		 	}
	 };
	 // ページのロード時に一度実行する
	 toggleNavbar();

	 // Windowsサイズの変更時のイベントを登録
	 var resizeTimer;
	 window.addEventListener('resize', function (event) {
	 	if (resizeTimer !== false) {
	 		clearTimeout(resizeTimer);
	 	}
	 	resizeTimer = setTimeout(toggleNavbar(), 100);
	 });

});

/**
* 保育施設絞り込みの開園時間のselectタグのoptionの生成
**/
function openTime()
{
	var startHour = 7;
	var endHour = 8;
	var options = '<option value="">開園</option>';
	for(var hour = startHour ; hour <=endHour; hour++){
		  options += '<option value="' + hour + ':00">' + hour + ':00以前</option>';
		  options += '<option value="' + hour + ':15">' + hour + ':15以前</option>';
		  options += '<option value="' + hour + ':45">' + hour + ':45以前</option>';
	}
	options += '<option value="9:00">9:00以前</option>';

	document.getElementById("pubNinkaOpenTime").innerHTML = options;
	document.getElementById("priNinkaOpenTime").innerHTML = options;
	document.getElementById("ninsyouOpenTime").innerHTML = options;
	document.getElementById("ninkagaiOpenTime").innerHTML = options;
	document.getElementById("kindergartenOpenTime").innerHTML = options;
	document.getElementById("jigyoshoOpenTime").innerHTML = options;
	document.getElementById("disabilityOpenTime").innerHTML = options;
}

/**
* 保育施設絞り込みの終園時間のselectタグのoptionの生成
**/
function closeTime()
{
	var startHour = 18;
	var endHour = 21;
	var options = '<option value="">終園</option>';
	for(var hour = startHour ; hour <=endHour; hour++){
		  options += '<option value="' + hour + ':00">' + hour + ':00以降</option>';
		  options += '<option value="' + hour + ':30">' + hour + ':30以降</option>';
	}
	options += '<option value="22:00">22:00以前</option>';

	document.getElementById("pubNinkaCloseTime").innerHTML = options;
	document.getElementById("priNinkaCloseTime").innerHTML = options;
	document.getElementById("ninsyouCloseTime").innerHTML = options;
	document.getElementById("ninkagaiCloseTime").innerHTML = options;
	document.getElementById("kindergartenCloseTime").innerHTML = options;
	document.getElementById("jigyoshoCloseTime").innerHTML = options;
	document.getElementById("disabilityCloseTime").innerHTML = options;
}
if (document.getElementById("filterdialog")) {
	openTime();
	closeTime();
}
