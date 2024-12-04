    // 지도를 표시할 div 요소를 가져옵니다.
    var mapContainer = document.getElementById('map');

    // 지도의 옵션을 설정합니다.
    var mapOption = {
      center: new kakao.maps.LatLng(33.392918, 126.570658), // 지도의 중심좌표
      level: 9 // 지도의 확대 레벨
    };

    // 지도를 생성합니다.
    var map = new kakao.maps.Map(mapContainer, mapOption);

    // 주소-좌표 변환 객체를 생성
    var geocoder = new kakao.maps.services.Geocoder();

    // 시/도 선택 콤보박스
    var citySelect = document.getElementById('citySelect');

    // 시/군/구 선택 콤보박스
    var sigunguSelect = document.getElementById('sigunguSelect');

    // 검색 버튼
    var searchButton = document.getElementById('searchButton');

    // 마커와 인포윈도우를 담을 배열
    var markers = [];
    var infowindows = [];

    // 함수로 묶어서 재사용할 수 있도록 변경
    function updateMap() {
      var selectedCity = citySelect.value;

      // 시/도에 따라 시/군/구 콤보박스의 옵션 변경
      if (selectedCity === '제주시') {
        sigunguSelect.innerHTML = '<option value="전체">전체</option><option value="제주시">제주시</option><option value="동부">동부</option><option value="서부">서부</option>';
      }
      if (selectedCity === '서귀포시') {
        sigunguSelect.innerHTML = '<option value="전체">전체</option><option value="서귀포시">서귀포시</option><option value="동부">동부</option><option value="서부">서부</option>';
      }
    }

    // 이전 마커와 인포윈도우를 제거하는 함수
    function removeAllMarkers() {
      markers.forEach(marker => {
        marker.setMap(null);
      });

      infowindows.forEach(infowindow => {
        infowindow.close();
      });

      markers = [];
      infowindows = [];
    }

    var firstClick = false;

    // 마커에 포커스를 맞추고 지도확대 함수
    function focusMarker(entry) {
      geocoder.addressSearch(entry.address, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
          map.panTo(coords);
          console.log("포커싱");
        }
      });

      if (!firstClick) {
        firstClick = true;
        console.log("첫번째 클릭");
        map.setLevel(6);
      }
    }

    // 검색 결과 업데이트 함수
    function updateSearchResults(results) {
      let resultsList = document.querySelector("#resultsList")
      resultsList.innerHTML = '';

      if (results && results.length > 0) {
        results.forEach((entry, index) => {
          var listItem = document.createElement('li');
          listItem.innerHTML = `<strong>${entry.centerName}</strong><br>${entry.address}`;
          resultsList.appendChild(listItem);

          listItem.addEventListener('click', function () {
            focusMarker(entry);
            
            // 상세 정보 표시
            const detailDiv = document.getElementById('centerDetail');
            const detailContent = document.getElementById('detailContent');
            detailDiv.style.display = 'block';
            
            detailContent.innerHTML = `
              <div class="detail-item"><strong>센터명:</strong> ${entry.centerName}</div>
              <div class="detail-item"><strong>주소:</strong> ${entry.address}</div>
              <div class="detail-item"><strong>전화번호:</strong> ${entry.tel}</div>
              <div class="detail-item"><strong>운영시간:</strong> ${entry.operatingTime || '정보 없음'}</div>
              <div class="detail-item"><strong>지역구분:</strong> ${entry.regionType}</div>
            `;
          });
        });
      } else {
        var listItem = document.createElement('li');
        listItem.textContent = '검색 결과가 없습니다.';
        resultsList.appendChild(listItem);
      }
    }
    

    // 검색 버튼 클릭 이벤트 처리 함수
    searchButton.addEventListener('click', function () {
      firstClick = false;
      removeAllMarkers();

      var centerPosition = new kakao.maps.LatLng(33.392918, 126.570658);
      map.setCenter(centerPosition);

      var selectedCity = citySelect.value;
      var selectedSigungu = sigunguSelect.value;

      const apiKey = 'b6c66f0c39240fae0227e0122bbcf604';
      var url;

      if (selectedCity === '제주시') {
        if (selectedSigungu === '전체') {
          url = `https://open.jejudatahub.net/api/proxy/at899998bt797a8098tttD79at97bDb7/${apiKey}?sigungu=제주시&limit=100`;
        } else {
          url = `https://open.jejudatahub.net/api/proxy/at899998bt797a8098tttD79at97bDb7/${apiKey}?sigungu=제주시&regionType=${selectedSigungu}&limit=100`;
        }
      } else if (selectedCity === '서귀포시') {
        if (selectedSigungu === '전체') {
          url = `https://open.jejudatahub.net/api/proxy/at899998bt797a8098tttD79at97bDb7/${apiKey}?sigungu=서귀포시&limit=100`;
        } else {
          url = `https://open.jejudatahub.net/api/proxy/at899998bt797a8098tttD79at97bDb7/${apiKey}?sigungu=서귀포시&regionType=${selectedSigungu}&limit=100`;
        }
      }

      var newMarkers = [];
      var newInfowindows = [];

      fetch(url)
        .then(response => response.json())
        .then(data => {
          console.log(data);

          if (data.data && data.data.length > 0) {
            data.data.forEach((entry, index) => {
              geocoder.addressSearch(entry.address, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                  var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                  var marker = new kakao.maps.Marker({
                    map: map,
                    position: coords
                  });

                  var infowindow = new kakao.maps.InfoWindow({
                    content: `<div style="width:150px;text-align:center;padding:6px 0;">${entry.centerName}</div>`
                  });
                  infowindow.open(map, marker);

                  newMarkers.push(marker);
                  newInfowindows.push(infowindow);

                  updateSearchResults(data.data);
                }
              });
            });

            markers = newMarkers;
            infowindows = newInfowindows;

            map.setLevel(9);
          } else {
            console.log('데이터가 없거나 형식이 다릅니다.');
          }
        })
        .catch(error => {
          console.error('데이터를 가져오는데 오류가 발생했습니다:', error);
        });
    })

    citySelect.addEventListener('change', updateMap);
