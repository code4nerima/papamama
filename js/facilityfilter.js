window.FacilityFilter = function () {
};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJsonを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @param  {[type]} checkObj [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function (conditions, nurseryFacilities, checkObj)
{
  	'use strict';

    // 絞り込んだ条件に一致する施設を格納するgeoJsonを準備
    var newGeoJson = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };

    // 施設名ごとにフィルターをかけるコールバックを返す
    var filterFunc = function (name) {
          return function (item,idx) {
                  var type = item.properties['種別'] ? item.properties['種別'] : item.properties.Type;
                  if(type == name) return true;
              };
    };

    // 公立認可保育園の検索元データを取得
    var pubNinkaFeatures = nurseryFacilities.features.filter(filterFunc("公立認可保育所"));

    // 私立認可保育園の検索元データを取得
    var priNinkaFeatures = nurseryFacilities.features.filter(filterFunc("私立認可保育園"));

    // 認証保育園の検索元データを取得
    var ninsyouFeatures = nurseryFacilities.features.filter(filterFunc("認証保育所"));

    // 認可外保育園の検索元データを取得
    var ninkagaiFeatures = nurseryFacilities.features.filter(filterFunc("認可外保育施設"));

    // 幼稚園の検索元データを取得
    var kindergartenFeatures = nurseryFacilities.features.filter(filterFunc("幼稚園"));

    // 小規模・事業所内保育事業の検索元データを取得
    var jigyoshoFeatures = nurseryFacilities.features.filter(filterFunc("小規模・事業所内保育事業"));

    // 障害児通所支援事業の検索元データを取得
    var disabilityFeatures = nurseryFacilities.features.filter(filterFunc("障害児通所支援事業"));

    // フィルターで渡すコールバック関数を返す
    var getFileterFunc = function (conditionVal, funcType) {

            // 開園時間でフィルターする関数
            if (funcType === 'OpenTime') {
                  return function (item, idx) {
                        var openHour = conditionVal.slice(0, conditionVal.indexOf(":"));
                        var openMin = Number(conditionVal.slice(-2));
                        var _open = new Date(2010, 0, 1, openHour, openMin, 0);
                        var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties.Open;
                        //各保育園の開園時間を変換
                        open = open.replace("：", ":");  //全角だったら半角に変更
                        var hour = open.slice(0, open.indexOf(":"));
                        var min = open.slice(-2);
                        var open_time = new Date(2010, 0, 1, hour, min, 0);
                        if(open !== "" && open_time <= _open) {
                            return true;
                        }
                  };

            // 終園時間でフィルターする関数
            } else if (funcType === 'CloseTime') {
                  return function (item, idx) {
                        var closeHour = conditionVal.slice(0, conditionVal.indexOf(":"));
                        var closeMin = Number(conditionVal.slice(-2));
                        var _close = new Date(2010, 0, 1, closeHour, closeMin, 0);
                        var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties.Close;
                        //各保育園の終園時間を変換
                        close = close.replace("：", ":");  //全角だったら半角に変更
                        var hour = close.slice(0, close.indexOf(":"));
                        if(hour !== "" && hour <= 12) hour = hour + 24;  //終園時間が24時過ぎの場合翌日扱い
                        var min = close.slice(-2);
                        var close_time = new Date(2010, 0, 1, hour, min, 0);
                        if(close_time >= _close) {
                            return true;
                        }
                  };

            // 24時間対応でフィルターする関数
            } else if (funcType === 'H24') {
                  return function (item, idx) {
                        var h24 = item.properties.H24 ? item.properties.H24 : item.properties.H24;
                        if(h24 === conditionVal) {
                            return true;
                        }
                  };

            // 一時保育でフィルターする関数
            } else if (funcType === 'IchijiHoiku') {
                  return function (item, idx) {
                        var temp = item.properties['一時'] ? item.properties['一時'] : item.properties.Temp;
                        if(temp === conditionVal) {
                              return true;
                          }
                  };

            // 夜間対応でフィルターする関数
            } else if (funcType === 'Yakan') {
                  return function (item, idx) {
                        var night = item.properties['夜間'] ? item.properties['夜間'] : item.properties.Night;
                        if(night === conditionVal) {
                              return true;
                          }
                  };

            // 休日対応でフィルターする関数
            } else if (funcType === 'Kyujitu') {
                  return function (item, idx) {
                        var holiday = item.properties['休日'] ? item.properties['休日'] : item.properties.Holiday;
                        if(holiday === conditionVal) {
                              return true;
                          }
                  };

            // 延長保育でフィルターする関数
            } else if (funcType === 'Encho') {
                  return function (item, idx) {
                        var extra = item.properties['延長保育'] ? item.properties['延長保育'] : item.properties.Extra;
                        if(extra === conditionVal) {
                              return true;
                          }
                  };

            // // 欠員情報でフィルターする関数
            // } else if (funcType === 'Vacancy') {
            //       return function (item, idx) {
            //             var vacancy = item.properties['Vacancy'] ? item.properties['Vacancy'] : item.properties['Vacancy'];
            //             if(vacancy === conditionVal) {
            //                   return true;
            //               }
            //       };

            }
    };

    // Google Analyticsイベントトラッキングの値を普遍値として作成
    var gaEventVal = Object.freeze({
      pubNinkaOpenTime:   1,
      pubNinkaCloseTime:  1*2**1,
      pubNinka24H:        1*2**2,
      pubNinkaIchijiHoiku: 1*2**3,
      pubNinkaYakan:       1*2**4,
      pubNinkaKyujitu:     1*2**5,
      pubNinkaEncho:       1*2**6,

      priNinkaOpenTime:   1*2**7,
      priNinkaCloseTime:  1*2**8,
      priNinka24H:        1*2**9,
      priNinkaIchijiHoiku: 1*2**10,
      priNinkaYakan:       1*2**11,
      priNinkaKyujitu:     1*2**12,
      priNinkaEncho:       1*2**13,

      ninkagaiOpenTime:   1*2**14,
      ninkagaiCloseTime:  1*2**15,
      ninkagai24H:        1*2**16,
      ninkagaiIchijiHoiku: 1*2**17,
      ninkagaiYakan:       1*2**18,
      ninkagaiKyujitu:     1*2**19,
      ninkagaiEncho:       1*2**20,

      ninsyouOpenTime:   1*2**21,
      ninsyouCloseTime:  1*2**22,
      ninsyou24H:        1*2**23,
      ninsyouIchijiHoiku: 1*2**24,
      ninsyouYakan:       1*2**25,
      ninsyouKyujitu:     1*2**26,
      ninsyouEncho:       1*2**27,

      kindergartenOpenTime:   1*2**28,
      kindergartenCloseTime:  1*2**29,
      kindergarten24H:        1*2**30,
      kindergartenIchijiHoiku: 1*2**31,
      kindergartenYakan:       1*2**32,
      kindergartenKyujitu:     1*2**33,
      kindergartenEncho:      1*2**34,

      jigyoshoOpenTime:   1*2**35,
      jigyoshoCloseTime:  1*2**36,
      jigyosho24H:        1*2**37,
      jigyoshoIchijiHoiku: 1*2**38,
      jigyoshoYakan:       1*2**39,
      jigyoshoKyujitu:     1*2**40,
      jigyoshoEncho:       1*2**41,

      disabilityOpenTime:   1*2**42,
      disabilityCloseTime:  1*2**43,
      disability24H:        1*2**44,
      disabilityIchijiHoiku: 1*2**45,
      disabilityYakan:       1*2**46,
      disabilityKyujitu:     1*2**47,
      disabilityEncho:       1*2**48
    });

    // ----------------------------------------------------------------------
    // 公立認可保育所向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.pubNinkaOpenTime) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaOpenTime, 'OpenTime'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaOpenTime;
    }
    if (conditions.pubNinkaCloseTime) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaCloseTime, 'CloseTime'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaCloseTime;
    }
    if (conditions.pubNinka24H) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinka24H, 'H24'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinka24H;
    }
    if (conditions.pubNinkaIchijiHoiku) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaIchijiHoiku, 'IchijiHoiku'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaIchijiHoiku;
    }
    if (conditions.pubNinkaYakan) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaYakan, 'Yakan'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaYakan;
    }
    if (conditions.pubNinkaKyujitu) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaKyujitu, 'Kyujitu'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaKyujitu;
    }
    if (conditions.pubNinkaEncho) {
        pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaEncho, 'Encho'));
        checkObj.pubNinka = true;
        checkObj.filterPattern += gaEventVal.pubNinkaEncho;
    }
    // if (conditions.pubNinkaVacancy) {
    //     pubNinkaFeatures = pubNinkaFeatures.filter(getFileterFunc(conditions.pubNinkaVacancy, 'Vacancy'));
    //     checkObj.pubNinka = true;
    // }

    // ----------------------------------------------------------------------
    // 私立認可保育所向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.priNinkaOpenTime) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaOpenTime, 'OpenTime'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaOpenTime;
    }
    if (conditions.priNinkaCloseTime) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaCloseTime, 'CloseTime'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaCloseTime;
    }
    if (conditions.priNinka24H) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinka24H, 'H24'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinka24H;
    }
    if (conditions.priNinkaIchijiHoiku) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaIchijiHoiku, 'IchijiHoiku'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaIchijiHoiku;
    }
    if (conditions.priNinkaYakan) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaYakan, 'Yakan'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaYakan;
    }
    if (conditions.priNinkaKyujitu) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaKyujitu, 'Kyujitu'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaKyujitu;
    }
    if (conditions.priNinkaEncho) {
        priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaEncho, 'Encho'));
        checkObj.priNinka= true;
        checkObj.filterPattern += gaEventVal.priNinkaEncho;
    }
    // if (conditions.priNinkaVacancy) {
    //     priNinkaFeatures = priNinkaFeatures.filter(getFileterFunc(conditions.priNinkaVacancy, 'Vacancy'));
    //     checkObj.priNinka= true;
    // }

    // ----------------------------------------------------------------------
    // 認証保育園向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.ninsyouOpenTime) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouOpenTime, 'OpenTime'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouOpenTime;
    }
    if (conditions.ninsyouCloseTime) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouCloseTime, 'CloseTime'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouCloseTime;
    }
    if (conditions.ninsyou24H) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyou24H, 'H24'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyou24H;
    }
    if (conditions.ninsyouIchijiHoiku) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouIchijiHoiku, 'IchijiHoiku'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouIchijiHoiku;
    }
    if (conditions.ninsyouYakan) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouYakan, 'Yakan'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouYakan;
    }
    if (conditions.ninsyouKyujitu) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouKyujitu, 'Kyujitu'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouKyujitu;
    }
    if (conditions.ninsyouEncho) {
        ninsyouFeatures = ninsyouFeatures.filter(getFileterFunc(conditions.ninsyouEncho, 'Encho'));
        checkObj.ninsyou = true;
        checkObj.filterPattern += gaEventVal.ninsyouEncho;
    }
    // if (conditions.ninkagaiVacancy) {
    //     ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiVacancy, 'Vacancy'));
    //     checkObj.ninkagai = true;
    // }


    // ----------------------------------------------------------------------
    // 認可外保育所向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.ninkagaiOpenTime) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiOpenTime, 'OpenTime'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiOpenTime;
    }
    if (conditions.ninkagaiCloseTime) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiCloseTime, 'CloseTime'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiCloseTime;
    }
    if (conditions.ninkagai24H) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagai24H, 'H24'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagai24H;
    }
    if (conditions.ninkagaiIchijiHoiku) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiIchijiHoiku, 'IchijiHoiku'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiIchijiHoiku;
    }
    if (conditions.ninkagaiYakan) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiYakan, 'Yakan'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiYakan;
    }
    if (conditions.ninkagaiKyujitu) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiKyujitu, 'Kyujitu'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiKyujitu;
    }
    if (conditions.ninkagaiEncho) {
        ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiEncho, 'Encho'));
        checkObj.ninkagai = true;
        checkObj.filterPattern += gaEventVal.ninkagaiEncho;
    }
    // if (conditions.ninkagaiVacancy) {
    //     ninkagaiFeatures = ninkagaiFeatures.filter(getFileterFunc(conditions.ninkagaiVacancy, 'Vacancy'));
    //     checkObj.ninkagai = true;
    // }

    // ----------------------------------------------------------------------
    // 横浜保育室向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.yhoikuOpenTime) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuOpenTime, 'OpenTime'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuOpenTime;
    }
    if (conditions.yhoikuCloseTime) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuCloseTime, 'CloseTime'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuCloseTime;
    }
    if (conditions.yhoiku24H) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoiku24H, 'H24'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoiku24H;
    }
    if (conditions.yhoikuIchijiHoiku) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuIchijiHoiku, 'IchijiHoiku'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuIchijiHoiku;
    }
    if (conditions.yhoikuYakan) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuYakan, 'Yakan'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuYakan;
    }
    if (conditions.yhoikuKyujitu) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuKyujitu, 'Kyujitu'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuKyujitu;
    }
    if (conditions.yhoikuEncho) {
        yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuEncho, 'Encho'));
        checkObj.yhoiku = true;
        checkObj.filterPattern += gaEventVal.yhoikuEncho;
    }
    // if (conditions.yhoikuVacancy) {
    //     yhoikuFeatures = yhoikuFeatures.filter(getFileterFunc(conditions.yhoikuVacancy, 'Vacancy'));
    //     checkObj.yhoiku = true;
    // }

    // ----------------------------------------------------------------------
    // 幼稚園向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.kindergartenOpenTime) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenOpenTime, 'OpenTime'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenOpenTime;
    }
    if (conditions.kindergartenCloseTime) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenCloseTime, 'CloseTime'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenCloseTime;
    }
    if (conditions.kindergarten24H) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergarten24H, 'H24'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergarten24H;
    }
    if (conditions.kindergartenIchijiHoiku) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenIchijiHoiku, 'IchijiHoiku'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenIchijiHoiku;
    }
    if (conditions.kindergartenYakan) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenYakan, 'Yakan'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenYakan;
    }
    if (conditions.kindergartenKyujitu) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenKyujitu, 'Kyujitu'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenKyujitu;
    }
    if (conditions.kindergartenEncho) {
        kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenEncho, 'Encho'));
        checkObj.kindergarten = true;
        checkObj.filterPattern += gaEventVal.kindergartenEncho;
    }
    // if (conditions.kindergartenVacancy) {
    //     kindergartenFeatures = kindergartenFeatures.filter(getFileterFunc(conditions.kindergartenVacancy, 'Vacancy'));
    //     checkObj.kindergarten = true;
    // }

    // ----------------------------------------------------------------------
    // 小規模・事業所内保育事業向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.jigyoshoOpenTime) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoOpenTime, 'OpenTime'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoOpenTime;
    }
    if (conditions.jigyoshoCloseTime) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoCloseTime, 'CloseTime'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoCloseTime;
    }
    if (conditions.jigyosho24H) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyosho24H, 'H24'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyosho24H;
    }
    if (conditions.jigyoshoIchijiHoiku) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoIchijiHoiku, 'IchijiHoiku'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoIchijiHoiku;
    }
    if (conditions.jigyoshoYakan) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoYakan, 'Yakan'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoYakan;
    }
    if (conditions.jigyoshoKyujitu) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoKyujitu, 'Kyujitu'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoKyujitu;
    }
    if (conditions.jigyoshoEncho) {
        jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoEncho, 'Encho'));
        checkObj.jigyosho = true;
        checkObj.filterPattern += gaEventVal.jigyoshoEncho;
    }
    // if (conditions.jigyoshoVacancy) {
    //     jigyoshoFeatures = jigyoshoFeatures.filter(getFileterFunc(conditions.jigyoshoVacancy, 'Vacancy'));
    //     checkObj.jigyosho = true;
    // }

    // ----------------------------------------------------------------------
    // 障害児通所支援事業向けフィルター
    // ----------------------------------------------------------------------
    if (conditions.disabilityOpenTime) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityOpenTime, 'OpenTime'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityOpenTime;
    }
    if (conditions.disabilityCloseTime) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityCloseTime, 'CloseTime'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityCloseTime;
    }
    if (conditions.disability24H) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disability24H, 'H24'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disability24H;
    }
    if (conditions.disabilityIchijiHoiku) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityIchijiHoiku, 'IchijiHoiku'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityIchijiHoiku;
    }
    if (conditions.disabilityYakan) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityYakan, 'Yakan'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityYakan;
    }
    if (conditions.disabilityKyujitu) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityKyujitu, 'Kyujitu'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityKyujitu;
    }
    if (conditions.disabilityEncho) {
        disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityEncho, 'Encho'));
        checkObj.disability = true;
        checkObj.filterPattern += gaEventVal.disabilityEncho;
    }
    // if (conditions.disabilityVacancy) {
    //     disabilityFeatures = disabilityFeatures.filter(getFileterFunc(conditions.disabilityVacancy, 'Vacancy'));
    //     checkObj.disability = true;
    // }

    // 戻り値の作成
    var features = [];
    Array.prototype.push.apply(features, pubNinkaFeatures);
    Array.prototype.push.apply(features, priNinkaFeatures);
    Array.prototype.push.apply(features, ninsyouFeatures);
    Array.prototype.push.apply(features, ninkagaiFeatures);
    Array.prototype.push.apply(features, yhoikuFeatures);
    Array.prototype.push.apply(features, kindergartenFeatures);
    Array.prototype.push.apply(features, jigyoshoFeatures);
    Array.prototype.push.apply(features, disabilityFeatures);
    newGeoJson.features = features;
    return newGeoJson;
};
