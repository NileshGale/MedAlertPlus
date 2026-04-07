<?php

function clinicMapsUrl(?float $lat, ?float $lng, string $address = '', string $name = '', ?float $originLat = null, ?float $originLng = null): string
{
    if ($originLat !== null && $originLng !== null && $lat !== null && $lng !== null) {
        return 'https://www.google.com/maps/dir/?api=1&origin=' . rawurlencode($originLat . ',' . $originLng)
            . '&destination=' . rawurlencode($lat . ',' . $lng);
    }
    if ($lat !== null && $lng !== null && abs($lat) > 0.0001 && abs($lng) > 0.0001) {
        return 'https://www.google.com/maps/dir/?api=1&destination=' . rawurlencode($lat . ',' . $lng);
    }
    $q = trim($name . ' ' . $address);
    if ($q !== '') {
        return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($q);
    }
    return 'https://www.google.com/maps/';
}

function clinicDistanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $earth = 6371.0;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) * sin($dLat / 2)
        + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) * sin($dLng / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earth * $c;
}

function clinicHttpJson(string $url, int $timeoutSec = 16): ?array
{
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => $timeoutSec,
            'ignore_errors' => true,
            'header' => "User-Agent: MedAlertPlus/1.0 (+http://localhost)\r\nAccept: application/json\r\n",
        ],
        'ssl' => ['verify_peer' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false || $raw === '') {
        return null;
    }
    $json = json_decode($raw, true);
    return is_array($json) ? $json : null;
}

function clinicGoogleGeocode(string $address, string $key): ?array
{
    if ($address === '' || strpos($key, 'replace-me') !== false) {
        return null;
    }
    $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . rawurlencode($address) . '&key=' . rawurlencode($key);
    $data = clinicHttpJson($url);
    if (!$data || ($data['status'] ?? '') !== 'OK' || empty($data['results'][0]['geometry']['location'])) {
        return null;
    }
    $loc = $data['results'][0]['geometry']['location'];
    return ['lat' => (float) $loc['lat'], 'lng' => (float) $loc['lng']];
}

function clinicGooglePlaceDetails(string $placeId, string $key): array
{
    $out = ['phone' => '', 'website' => ''];
    if ($placeId === '' || strpos($key, 'replace-me') !== false) {
        return $out;
    }
    $url = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' . rawurlencode($placeId)
        . '&fields=formatted_phone_number,international_phone_number,website&key=' . rawurlencode($key);
    $data = clinicHttpJson($url);
    if (!$data || ($data['status'] ?? '') !== 'OK' || empty($data['result'])) {
        return $out;
    }
    $r = $data['result'];
    $out['phone'] = $r['formatted_phone_number'] ?? $r['international_phone_number'] ?? '';
    $out['website'] = $r['website'] ?? '';
    return $out;
}

function clinicGoogleTextSearchNear(float $lat, float $lng, string $key): array
{
    // Use nearbysearch with rankby=distance to get the absolute closest results first
    $url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' . $lat . ',' . $lng . '&rankby=distance&keyword=' . rawurlencode('clinic OR hospital OR doctor') . '&key=' . rawurlencode($key);
    $data = clinicHttpJson($url);
    if (!$data || !in_array($data['status'] ?? '', ['OK', 'ZERO_RESULTS'], true)) {
        return [];
    }
    return $data['results'] ?? [];
}

function clinicGoogleTextSearchQuery(string $queryText, string $key): array
{
    $url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' . rawurlencode($queryText) . '&key=' . rawurlencode($key);
    $data = clinicHttpJson($url);
    if (!$data || !in_array($data['status'] ?? '', ['OK', 'ZERO_RESULTS'], true)) {
        return [];
    }
    return $data['results'] ?? [];
}

function clinicGoogleDistanceMatrix(float $originLat, float $originLng, array $destinations, string $key): array
{
    if (empty($destinations) || strpos($key, 'replace-me') !== false) {
        return [];
    }
    $destParam = implode('|', array_map(function ($d) {
        return $d['lat'] . ',' . $d['lng'];
    }, $destinations));
    $url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='
        . rawurlencode($originLat . ',' . $originLng)
        . '&destinations=' . rawurlencode($destParam)
        . '&mode=driving&units=metric&key=' . rawurlencode($key);
    $json = clinicHttpJson($url, 20);
    if (!$json || ($json['status'] ?? '') !== 'OK' || empty($json['rows'][0]['elements'])) {
        return [];
    }
    $out = [];
    foreach ($json['rows'][0]['elements'] as $idx => $el) {
        if (($el['status'] ?? '') !== 'OK') {
            continue;
        }
        $out[$idx] = [
            'distance_km' => isset($el['distance']['value']) ? round(((float) $el['distance']['value']) / 1000, 2) : null,
            'distance_text' => $el['distance']['text'] ?? null,
            'duration_text' => $el['duration']['text'] ?? null,
        ];
    }
    return $out;
}

function clinicNominatimSearch(string $query, int $limit = 8): array
{
    if ($query === '') {
        return [];
    }
    $url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=' . max(1, min(20, $limit))
        . '&q=' . rawurlencode($query);
    $data = clinicHttpJson($url, 18);
    return is_array($data) ? $data : [];
}

function clinicNominatimReverse(float $lat, float $lng): ?array
{
    $url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=' . $lat . '&lon=' . $lng;
    $data = clinicHttpJson($url, 18);
    if (!$data || !isset($data['lat'], $data['lon'])) {
        return null;
    }
    return $data;
}

function clinicOverpassNearby(float $lat, float $lng, int $radius = 8000): array
{
    $radius = max(500, min(30000, $radius));
    $query = '[out:json][timeout:25];('
        . 'node["amenity"~"hospital|clinic|doctors"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . 'way["amenity"~"hospital|clinic|doctors"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . 'relation["amenity"~"hospital|clinic|doctors"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . 'node["healthcare"~"hospital|clinic|doctor"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . 'way["healthcare"~"hospital|clinic|doctor"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . 'relation["healthcare"~"hospital|clinic|doctor"](around:' . $radius . ',' . $lat . ',' . $lng . ');'
        . ');out center 40;';
    $url = 'https://overpass-api.de/api/interpreter?data=' . rawurlencode($query);
    $json = clinicHttpJson($url, 25);
    if (!$json || !isset($json['elements']) || !is_array($json['elements'])) {
        return [];
    }
    return $json['elements'];
}

function clinicFromOsmElement(array $e): ?array
{
    $t = $e['tags'] ?? [];
    $name = trim((string) ($t['name'] ?? ''));
    if ($name === '') {
        return null;
    }
    $lat = isset($e['lat']) ? (float) $e['lat'] : (isset($e['center']['lat']) ? (float) $e['center']['lat'] : null);
    $lng = isset($e['lon']) ? (float) $e['lon'] : (isset($e['center']['lon']) ? (float) $e['center']['lon'] : null);
    $addr = trim(implode(', ', array_filter([
        $t['addr:housenumber'] ?? '',
        $t['addr:street'] ?? '',
        $t['addr:suburb'] ?? '',
        $t['addr:city'] ?? ($t['addr:town'] ?? ''),
        $t['addr:state'] ?? '',
        $t['addr:postcode'] ?? '',
    ])));
    $phone = trim((string) ($t['phone'] ?? ($t['contact:phone'] ?? '')));
    $website = trim((string) ($t['website'] ?? ($t['contact:website'] ?? '')));

    return [
        'id' => 0,
        'source' => 'osm',
        'clinic_name' => $name,
        'clinic_address' => $addr,
        'fees' => 'Contact clinic for fee information',
        'clinic_status' => 'open',
        'doctor_name' => '—',
        'contact' => $phone !== '' ? $phone : '—',
        'lat' => $lat,
        'lng' => $lng,
        'maps_url' => clinicMapsUrl($lat, $lng, $addr, $name),
        'website' => $website,
    ];
}

function clinicAddressSuggestions(array $get): array
{
    $q = trim((string) ($get['q'] ?? ''));
    $country = trim((string) ($get['country'] ?? ''));
    if (strlen($q) < 3) {
        return [];
    }
    $query = $q . ($country !== '' ? ', ' . $country : '');
    $rows = clinicNominatimSearch($query, 8);
    $out = [];
    foreach ($rows as $r) {
        $a = $r['address'] ?? [];
        $out[] = [
            'display_name' => (string) ($r['display_name'] ?? ''),
            'lat' => isset($r['lat']) ? (float) $r['lat'] : null,
            'lng' => isset($r['lon']) ? (float) $r['lon'] : null,
            'address_line' => trim((string) (($a['road'] ?? '') . ' ' . ($a['house_number'] ?? ''))),
            'city' => (string) ($a['city'] ?? ($a['town'] ?? ($a['village'] ?? ''))),
            'state' => (string) ($a['state'] ?? ''),
            'postal_code' => (string) ($a['postcode'] ?? ''),
            'country' => (string) ($a['country'] ?? ''),
        ];
    }
    return $out;
}

function clinicReverseLookup(array $get): ?array
{
    if (!isset($get['lat'], $get['lng'])) {
        return null;
    }
    $lat = (float) $get['lat'];
    $lng = (float) $get['lng'];
    if (abs($lat) > 90 || abs($lng) > 180) {
        return null;
    }
    $r = clinicNominatimReverse($lat, $lng);
    if (!$r) {
        return null;
    }
    $a = $r['address'] ?? [];
    return [
        'display_name' => (string) ($r['display_name'] ?? ''),
        'lat' => isset($r['lat']) ? (float) $r['lat'] : $lat,
        'lng' => isset($r['lon']) ? (float) $r['lon'] : $lng,
        'address_line' => trim((string) (($a['road'] ?? '') . ' ' . ($a['house_number'] ?? ''))),
        'city' => (string) ($a['city'] ?? ($a['town'] ?? ($a['village'] ?? ''))),
        'state' => (string) ($a['state'] ?? ''),
        'postal_code' => (string) ($a['postcode'] ?? ''),
        'country' => (string) ($a['country'] ?? ''),
    ];
}

function mergeClinicSearchResults(PDO $pdo, array $get): array
{
    $key = defined('GOOGLE_PLACES_API_KEY') ? GOOGLE_PLACES_API_KEY : '';
    $keyOk = $key !== '' && strpos($key, 'replace-me') === false;

    $latIn = isset($get['lat']) ? (float) $get['lat'] : null;
    $lngIn = isset($get['lng']) ? (float) $get['lng'] : null;

    $addressLine = trim((string) ($get['address_line'] ?? ''));
    $city = trim((string) ($get['city'] ?? ''));
    $state = trim((string) ($get['state'] ?? ''));
    $postal = trim((string) ($get['postal_code'] ?? ''));
    $country = trim((string) ($get['country'] ?? '')) ?: 'India';
    $legacyQuery = trim((string) ($get['query'] ?? ''));

    $parts = array_filter([$addressLine, $city, $state, $postal, $country]);
    $fullAddress = implode(', ', $parts);
    if ($fullAddress === '' && $legacyQuery !== '') {
        $fullAddress = $legacyQuery;
    }

    $lat = ($latIn !== null && $lngIn !== null && abs($latIn) <= 90 && abs($lngIn) <= 180) ? $latIn : null;
    $lng = ($lat !== null) ? $lngIn : null;

    if ($lat === null && $fullAddress !== '') {
        if ($keyOk) {
            $geo = clinicGoogleGeocode($fullAddress, $key);
            if ($geo) {
                $lat = $geo['lat'];
                $lng = $geo['lng'];
            }
        }
        if ($lat === null) {
            $osm = clinicNominatimSearch($fullAddress, 1);
            if (!empty($osm[0]['lat']) && !empty($osm[0]['lon'])) {
                $lat = (float) $osm[0]['lat'];
                $lng = (float) $osm[0]['lon'];
            }
        }
    }

    $dbSearch = $city !== '' ? $city : ($legacyQuery !== '' ? $legacyQuery : $fullAddress);
    $merged = [];

    $sql = "SELECT d.id, d.clinic_name, d.clinic_address, d.fees, d.clinic_status, d.clinic_phone,
                   u.name AS doctor_name, u.phone AS user_phone
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.approval_status = 'approved'";
    $params = [];
    if ($dbSearch !== '') {
        $sql .= ' AND (d.clinic_name LIKE ? OR d.clinic_address LIKE ? OR u.name LIKE ?)';
        $term = '%' . $dbSearch . '%';
        $params = [$term, $term, $term];
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $dbRows = $stmt->fetchAll();

    foreach ($dbRows as $row) {
        $phone = trim((string) ($row['clinic_phone'] ?? ''));
        if ($phone === '') {
            $phone = trim((string) ($row['user_phone'] ?? ''));
        }
        $merged[] = [
            'id' => (int) $row['id'],
            'source' => 'platform',
            'clinic_name' => $row['clinic_name'] ?: 'Clinic',
            'clinic_address' => $row['clinic_address'] ?: '',
            'fees' => $row['fees'] !== null && $row['fees'] !== '' ? $row['fees'] : 'Contact clinic',
            'clinic_status' => $row['clinic_status'] ?? 'open',
            'doctor_name' => $row['doctor_name'] ?? '',
            'contact' => $phone !== '' ? $phone : '—',
            'lat' => null,
            'lng' => null,
            'maps_url' => clinicMapsUrl(null, null, (string) $row['clinic_address'], (string) $row['clinic_name'], $lat, $lng),
            'website' => '',
        ];
    }

    $ext = [];
    if ($keyOk) {
        $places = [];
        if ($lat !== null && $lng !== null) {
            $places = clinicGoogleTextSearchNear($lat, $lng, $key);
        }
        if (count($places) === 0 && $fullAddress !== '') {
            $places = clinicGoogleTextSearchQuery('hospitals medical clinics doctors near ' . $fullAddress, $key);
        }
        $seen = [];
        foreach (array_slice($places, 0, 12) as $p) {
            $pid = (string) ($p['place_id'] ?? '');
            if ($pid !== '' && isset($seen[$pid])) {
                continue;
            }
            if ($pid !== '') {
                $seen[$pid] = true;
            }
            $det = $pid !== '' ? clinicGooglePlaceDetails($pid, $key) : ['phone' => '', 'website' => ''];
            usleep(60000);
            $plat = isset($p['geometry']['location']['lat']) ? (float) $p['geometry']['location']['lat'] : null;
            $plng = isset($p['geometry']['location']['lng']) ? (float) $p['geometry']['location']['lng'] : null;
            $addr = (string) ($p['formatted_address'] ?? ($p['vicinity'] ?? ''));
            $name = (string) ($p['name'] ?? 'Clinic');
            $ext[] = [
                'id' => 0,
                'source' => 'google',
                'clinic_name' => $name,
                'clinic_address' => $addr,
                'fees' => 'Contact clinic for fee information',
                'clinic_status' => (($p['business_status'] ?? '') === 'OPERATIONAL') ? 'open' : 'closed',
                'doctor_name' => '—',
                'contact' => $det['phone'] !== '' ? $det['phone'] : '—',
                'lat' => $plat,
                'lng' => $plng,
                'maps_url' => clinicMapsUrl($plat, $plng, $addr, $name, $lat, $lng),
                'website' => $det['website'] ?? '',
            ];
        }
    }

    if (count($ext) === 0 && $lat !== null && $lng !== null) {
        $searchRadius = isset($get['max_km']) ? (int)((float)$get['max_km'] * 1000) : 10000;
        $osmEls = clinicOverpassNearby($lat, $lng, $searchRadius);
        
        // Auto-expand if no results found within requested radius (up to 20km)
        if (count($osmEls) === 0 && $searchRadius < 20000) {
            $osmEls = clinicOverpassNearby($lat, $lng, 20000);
        }
        
        foreach ($osmEls as $el) {
            $row = clinicFromOsmElement($el);
            if ($row) {
                $row['maps_url'] = clinicMapsUrl(
                    isset($row['lat']) ? (float) $row['lat'] : null,
                    isset($row['lng']) ? (float) $row['lng'] : null,
                    (string) ($row['clinic_address'] ?? ''),
                    (string) ($row['clinic_name'] ?? ''),
                    $lat,
                    $lng
                );
                $ext[] = $row;
            }
        }
    }

    // Keep only actually nearby clinics when we know search center location.
    if ($lat !== null && $lng !== null) {
        $maxDistanceKm = isset($get['max_km']) ? max(1.0, min(30.0, (float) $get['max_km'])) : 8.0;
        foreach ($ext as &$r) {
            if (isset($r['lat'], $r['lng']) && is_numeric($r['lat']) && is_numeric($r['lng'])) {
                $r['distance_km'] = round(clinicDistanceKm($lat, $lng, (float) $r['lat'], (float) $r['lng']), 2);
            } else {
                $r['distance_km'] = null;
            }
        }
        unset($r);

        // Prefer Google Maps driving distance/time where available.
        if ($keyOk) {
            $distanceTargets = [];
            $indexMap = [];
            foreach ($ext as $idx => $r) {
                if (isset($r['lat'], $r['lng']) && is_numeric($r['lat']) && is_numeric($r['lng'])) {
                    $indexMap[] = $idx;
                    $distanceTargets[] = ['lat' => (float) $r['lat'], 'lng' => (float) $r['lng']];
                }
                if (count($distanceTargets) >= 10) {
                    break;
                }
            }
            $matrix = clinicGoogleDistanceMatrix($lat, $lng, $distanceTargets, $key);
            foreach ($matrix as $mIdx => $distRow) {
                if (!isset($indexMap[$mIdx])) {
                    continue;
                }
                $targetIdx = $indexMap[$mIdx];
                $ext[$targetIdx]['distance_km'] = $distRow['distance_km'];
                $ext[$targetIdx]['distance_text'] = $distRow['distance_text'];
                $ext[$targetIdx]['duration_text'] = $distRow['duration_text'];
            }
        }

        $ext = array_values(array_filter($ext, function ($r) use ($maxDistanceKm) {
            return isset($r['distance_km']) && is_numeric($r['distance_km']) && (float) $r['distance_km'] <= $maxDistanceKm;
        }));

        usort($ext, function ($a, $b) {
            return ($a['distance_km'] ?? 9999) <=> ($b['distance_km'] ?? 9999);
        });
    }

    return array_merge($merged, array_slice($ext, 0, 20));
}
