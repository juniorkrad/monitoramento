// ==============================================================================
// dashboard360-engine.js - Motor da Visão Unificada (Dashboard 360)
// Responsável por cruzar todas as variáveis globais e renderizar a tela.
// ==============================================================================

window.Dashboard360Engine = {
    currentOlt: null,
    currentType: null,
    currentBoards: 0,
    currentPlaca: null,
    clientsData: {}, 

    init: function() {
        window.addEventListener('dadosAtualizados', () => this.renderCards());
        
        if (window.DATA_STORE && window.DATA_STORE.isReady) {
            this.renderCards();
        }
    },

    renderCards: function() {
        const container = document.getElementById('dashboard-container');
        const isDashboard360Page = window.location.pathname.includes('dashboard360.html');
        
        if (!container || !isDashboard360Page) return;

        container.innerHTML = '';

        GLOBAL_MASTER_OLT_LIST.forEach(olt => {
            let up = 0, down = 0;
            if (window.GLOBAL_NET_STATS) {
                const netStat = window.GLOBAL_NET_STATS.find(s => s.id === olt.id);
                if (netStat) {
                    up = netStat.online;
                    down = netStat.offline;
                }
            }

            let energyOff = 0, signalOff = 0;
            if (window.ENERGY_DATA_STORE && window.ENERGY_DATA_STORE.olts && window.ENERGY_DATA_STORE.olts[olt.id]) {
                energyOff = window.ENERGY_DATA_STORE.olts[olt.id].powerOff || 0;
                signalOff = window.ENERGY_DATA_STORE.olts[olt.id].offlineOther || 0;
            }

            let potMedia = "0.0";
            if (window.GLOBAL_POTENCIA_STATS) {
                const potStat = window.GLOBAL_POTENCIA_STATS.find(s => s.id === olt.id);
                if (potStat) potMedia = potStat.media;
            }

            let tempMax = 0;
            if (window.GLOBAL_TEMP_STATS) {
                const tempStat = window.GLOBAL_TEMP_STATS.find(s => s.id === olt.id);
                if (tempStat) tempMax = tempStat.maxTemp;
            }

            const totalClients = up + down;
            let lastUpdateStr = '--/--/---- --:--:--';
            
            if (window.OLT_LAST_UPDATES && window.OLT_LAST_UPDATES[olt.id]) {
                lastUpdateStr = window.OLT_LAST_UPDATES[olt.id];
            } else {
                const values = window.DATA_STORE?.olts?.[olt.id] || [];
                if (values.length > 0) {
                    const firstRow = values[0];
                    let cellData = firstRow[10] ? String(firstRow[10]) : '';
                    if (!cellData) {
                        for (let i = firstRow.length - 1; i >= 0; i--) {
                            let val = firstRow[i] ? String(firstRow[i]) : '';
                            if (val.match(/\d{2}\/\d{2}/) && val.match(/\d{2}:\d{2}/)) {
                                cellData = val; break;
                            }
                        }
                    }
                    if (cellData) {
                        const dateMatch = cellData.match(/\d{2}\/\d{2}\/\d{2,4}/);
                        const timeMatch = cellData.match(/\d{2}:\d{2}(:\d{2})?/);
                        if (dateMatch && timeMatch) lastUpdateStr = `${dateMatch[0]} ${timeMatch[0]}`;
                    }
                }
            }
            const dateVal = lastUpdateStr.split(' ')[0] || '--/--/----';
            const timeVal = lastUpdateStr.split(' ')[1] || '--:--:--';

            const potValue = parseFloat(potMedia);
            const potColor = potValue <= -28.00 ? 'text-error' : (potValue <= -26.00 ? 'text-warning' : 'text-success');
            const tempColor = tempMax >= 80 ? (tempMax >= 90 ? 'text-error' : 'text-warning') : 'text-success';
            
            const isCritical = (down > 30 || energyOff > 10 || tempMax >= 90);
            const cardBorder = isCritical ? 'border-color: rgba(248, 113, 113, 0.4); box-shadow: 0 0 15px rgba(248, 113, 113, 0.1);' : '';
            const titleColor = isCritical ? 'color: var(--m3-color-error);' : '';

            const cardHTML = `
                <div class="card-360" style="${cardBorder}">
                    <div class="card-header">
                        <h3 style="${titleColor}"><span class="material-symbols-rounded">dns</span> ${olt.id}</h3>
                        <button class="btn-action" onclick="Dashboard360Engine.openModal('${olt.id}', '${olt.type}', ${olt.boards})" title="Ver Detalhes">
                            <span class="material-symbols-rounded">manage_search</span>
                        </button>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--m3-on-surface-variant); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                            <span class="material-symbols-rounded" style="font-size: 16px;">groups</span> Total OLT
                        </span>
                        <span style="font-family: var(--font-family-mono); font-weight: bold; font-size: 1.2rem; color: var(--m3-on-surface);">${totalClients}</span>
                    </div>

                    <div class="card-body">
                        <div class="quadrant" title="Conectividade (UP / DOWN)">
                            <span class="material-symbols-rounded quad-icon">router</span>
                            <div class="quad-content">
                                <div class="stat-row">
                                    <span class="material-symbols-rounded text-success">arrow_upward</span>
                                    <span class="text-success">${up}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="material-symbols-rounded text-error">arrow_downward</span>
                                    <span class="text-error">${down}</span>
                                </div>
                            </div>
                        </div>

                        <div class="quadrant" title="Falhas (Sem Sinal / Sem Energia)">
                            <span class="material-symbols-rounded quad-icon">bolt</span>
                            <div class="quad-content">
                                <div class="stat-row">
                                    <span class="material-symbols-rounded text-orange">wifi_off</span>
                                    <span class="${signalOff > 0 ? 'text-orange' : 'text-muted'}">${signalOff}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="material-symbols-rounded text-warning">power_off</span>
                                    <span class="${energyOff > 0 ? 'text-warning' : 'text-muted'}">${energyOff}</span>
                                </div>
                            </div>
                        </div>

                        <div class="quadrant" title="Média de Potência Óptica">
                            <span class="material-symbols-rounded quad-icon">vital_signs</span>
                            <div class="quad-content">
                                <div class="big-val ${potColor}">${potMedia}</div>
                                <span class="val-unit">dBm</span>
                            </div>
                        </div>

                        <div class="quadrant" title="Temperatura Máxima">
                            <span class="material-symbols-rounded quad-icon">device_thermostat</span>
                            <div class="quad-content">
                                <div class="big-val ${tempColor}">${tempMax}°</div>
                                <span class="val-unit">Temp.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid var(--m3-outline); padding-top: 12px; margin-top: 12px; display: flex; justify-content: center; align-items: center; gap: 15px; width: 100%; font-size: 0.75rem; color: var(--m3-on-surface-variant); font-family: var(--font-family-mono);">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span class="material-symbols-rounded" style="font-size: 14px;">calendar_today</span> ${dateVal}
                        </div>
                        <span style="color: rgba(255,255,255,0.1);">|</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span class="material-symbols-rounded" style="font-size: 14px;">schedule</span> ${timeVal}
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    },

    openModal: function(oltId, type, boards) {
        this.currentOlt = oltId;
        this.currentType = type;
        this.currentBoards = boards;
        this.clientsData = {}; 

        document.getElementById('modal-title').innerHTML = `<span class="material-symbols-rounded">dns</span> ${oltId}`;
        document.getElementById('super-modal').style.display = 'flex';
        
        const pContainer = document.getElementById('placas-container');
        pContainer.className = 'mini-cards-grid'; 
        pContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--m3-on-surface-variant);">Cruzando dados das placas...</div>';
        
        this.showPlacas();

        setTimeout(() => {
            const rows = window.DATA_STORE.olts[oltId]?.slice(1) || [];
            let placaData = {};
            
            for (let i = 1; i <= boards; i++) placaData[i] = { ports: {} };

            rows.forEach(cols => {
                if (cols.length === 0) return;
                const pInfo = DataMapper.extractPort(cols[0], type);
                if (!pInfo) return;
                
                const placa = parseInt(pInfo.placa);
                const porta = parseInt(pInfo.porta);
                
                if (placa > boards || placa < 1) return;

                const isOnline = DataMapper.isOnline(cols[type === 'nokia' ? 4 : 2], type);
                const power = DataMapper.parsePowerValue(cols[5]);

                if (!placaData[placa].ports[porta]) {
                    placaData[placa].ports[porta] = { online: 0, offline: 0, validPowerCount: 0, sumPower: 0 };
                }

                if (isOnline) placaData[placa].ports[porta].online++;
                else placaData[placa].ports[porta].offline++;

                if (DataMapper.isValidPower(power)) {
                    placaData[placa].ports[porta].validPowerCount++;
                    placaData[placa].ports[porta].sumPower += power;
                }
            });

            pContainer.innerHTML = '';

            for (let i = 1; i <= boards; i++) {
                let pOnline = 0, pOffline = 0, pPowerOff = 0;
                let sumPot = 0, countPot = 0;
                let countCritico = 0, countProblema = 0, countAtencao = 0;

                const ports = placaData[i].ports;
                for (const pt in ports) {
                    const pd = ports[pt];
                    const total = pd.online + pd.offline;
                    
                    pOnline += pd.online;
                    pOffline += pd.offline;
                    sumPot += pd.sumPower;
                    countPot += pd.validPowerCount;

                    if (total >= 5) {
                        const percOffline = pd.offline / total;
                        if (percOffline === 1) countCritico++;
                        else if (percOffline >= 0.5 || pd.offline >= 32) countProblema++;
                        else if (pd.offline >= 16) countAtencao++;
                    }

                    if (window.ENERGY_DATA_STORE?.olts?.[oltId]?.ports?.[i]?.[pt]) {
                        pPowerOff += window.ENERGY_DATA_STORE.olts[oltId].ports[i][pt].powerOff || 0;
                    }
                }

                let redeBadge = '<span class="status status-normal">Normal</span>';
                if (countCritico >= 1 || countProblema >= 4) redeBadge = '<span class="status status-critico">Crítico</span>';
                else if ((countProblema >= 1 && countProblema <= 3) || countAtencao >= 4) redeBadge = '<span class="status status-problema">Problema</span>';
                else if (countAtencao >= 1 && countAtencao <= 3) redeBadge = '<span class="status status-atencao">Atenção</span>';
                else if (pOnline + pOffline === 0) redeBadge = '<span class="status" style="color:var(--m3-on-surface-variant); background:rgba(255,255,255,0.1);">S/ Clientes</span>';

                let energiaBadge = '<span class="status status-normal">Normal</span>';
                if (pPowerOff > 0) {
                    energiaBadge = `<span class="status status-atencao">${pPowerOff} Sem Energia</span>`;
                } else if (pOnline + pOffline === 0) {
                    energiaBadge = '<span class="status" style="color:var(--m3-on-surface-variant); background:rgba(255,255,255,0.1);">-</span>';
                }

                let potMedia = countPot > 0 ? (sumPot / countPot).toFixed(1) : 0;
                let potBadge = '<span class="status status-normal">N/A</span>';
                if (potMedia !== 0) {
                    if (potMedia <= -28.0) potBadge = `<span class="status status-critico">${potMedia} dBm</span>`;
                    else if (potMedia <= -26.0) potBadge = `<span class="status status-atencao">${potMedia} dBm</span>`;
                    else potBadge = `<span class="status status-normal">${potMedia} dBm</span>`;
                } else if (pOnline + pOffline === 0) {
                    potBadge = '<span class="status" style="color:var(--m3-on-surface-variant); background:rgba(255,255,255,0.1);">-</span>';
                }

                pContainer.innerHTML += `
                    <div class="placa-mini-card" onclick="Dashboard360Engine.openPortas(${i})">
                        <div class="placa-mini-card-header">
                            <span class="material-symbols-rounded">developer_board</span>
                            Placa ${i}
                        </div>
                        <div class="placa-mini-card-body">
                            <div class="placa-mini-card-row">
                                <span class="label">Rede:</span>
                                ${redeBadge}
                            </div>
                            <div class="placa-mini-card-row">
                                <span class="label">Energia:</span>
                                ${energiaBadge}
                            </div>
                            <div class="placa-mini-card-row">
                                <span class="label">Potência:</span>
                                ${potBadge}
                            </div>
                        </div>
                    </div>
                `;
            }
        }, 50);
    },

    showPlacas: function() {
        document.getElementById('view-placas').style.display = 'block';
        document.getElementById('view-portas').style.display = 'none';
        
        const btnBack = document.getElementById('btn-back');
        if (btnBack) btnBack.style.display = 'none';
        
        document.getElementById('modal-title').innerHTML = `<span class="material-symbols-rounded">dns</span> ${this.currentOlt}`;
    },

    closeModal: function() {
        document.getElementById('super-modal').style.display = 'none';
    },

    openPortas: function(placa) {
        this.currentPlaca = placa;
        this.clientsData = {}; 

        document.getElementById('view-placas').style.display = 'none';
        document.getElementById('view-portas').style.display = 'block';
        
        const btnBack = document.getElementById('btn-back');
        if (btnBack) btnBack.style.display = 'flex';
        
        document.getElementById('modal-title').innerHTML = `<span class="material-symbols-rounded">dns</span> ${this.currentOlt} <span style="color:var(--m3-on-surface-variant); margin: 0 5px;">/</span> Placa ${placa}`;

        const tbody = document.getElementById('portas-tbody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">Cruzando dados da placa...</td></tr>';

        setTimeout(() => {
            const rows = window.DATA_STORE.olts[this.currentOlt]?.slice(1) || [];
            const rowsCircuitos = window.DATA_STORE.circuitos || [];
            const rowsLocalidades = window.DATA_STORE.localidades || [];
            
            const portData = {};

            rows.forEach(cols => {
                if (cols.length === 0) return;
                
                const pInfo = DataMapper.extractPort(cols[0], this.currentType);
                if (!pInfo || parseInt(pInfo.placa) !== placa) return;

                const pNum = parseInt(pInfo.porta);
                const isOnline = DataMapper.isOnline(cols[this.currentType === 'nokia' ? 4 : 2], this.currentType);
                const power = DataMapper.parsePowerValue(cols[5]);
                
                let serialVal = '', codigoVal = '', statusRefVal = '';
                let potenciaVal = String(cols[5] || '').replace(/dbm/ig, '').replace(/\s+/g, '');
                
                if (this.currentType === 'nokia') {
                    serialVal = cols[2] || '';
                    codigoVal = cols[8] || '';
                    statusRefVal = cols[4] || '';
                } else {
                    serialVal = cols[3] || '';
                    codigoVal = cols[7] || '';
                    statusRefVal = cols[2] || '';
                }

                if (!portData[pNum]) {
                    portData[pNum] = { online: 0, offline: 0, validPowerCount: 0, sumPower: 0 };
                    this.clientsData[pNum] = [];
                }

                if (isOnline) portData[pNum].online++;
                else portData[pNum].offline++;

                if (DataMapper.isValidPower(power)) {
                    portData[pNum].validPowerCount++;
                    portData[pNum].sumPower += power;
                }

                this.clientsData[pNum].push({
                    serial: String(serialVal).trim(),
                    codigo: String(codigoVal).trim(),
                    potenciaStr: potenciaVal,
                    potenciaNum: power,
                    statusRef: String(statusRefVal).trim(),
                    isOnline: isOnline
                });
            });

            tbody.innerHTML = '';
            const sortedPorts = Object.keys(portData).sort((a,b) => parseInt(a) - parseInt(b));

            if(sortedPorts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">Nenhuma porta ativa com clientes encontrada nesta placa.</td></tr>';
                return;
            }

            sortedPorts.forEach(pt => {
                const pd = portData[pt];
                const totalClients = pd.online + pd.offline;
                const percOffline = totalClients > 0 ? (pd.offline / totalClients) : 0;
                
                const circuito = DataMapper.getCircuitInfo(rowsCircuitos, { id: this.currentOlt, type: this.currentType }, placa, pt);
                const bairro = DataMapper.getBairroInfo(rowsLocalidades, this.currentOlt, placa, pt, this.currentType) || 'N/A';
                const safeInfo = circuito.replace(/'/g, "\\'");
                
                let redeStatusClass = 'status-normal';
                let redeStatusText = 'Normal';
                if (totalClients >= 5) {
                    if (percOffline === 1) { 
                        redeStatusClass = 'status-critico'; 
                        redeStatusText = 'Crítico'; 
                    } else if (percOffline >= 0.5 || pd.offline >= 32) { 
                        redeStatusClass = 'status-problema'; 
                        redeStatusText = 'Problema'; 
                    } else if (pd.offline >= 16) { 
                        redeStatusClass = 'status-atencao'; 
                        redeStatusText = 'Atenção'; 
                    }
                }

                let energyOff = 0;
                if (window.ENERGY_DATA_STORE?.olts?.[this.currentOlt]?.ports?.[placa]?.[pt]) {
                    energyOff = window.ENERGY_DATA_STORE.olts[this.currentOlt].ports[placa][pt].powerOff || 0;
                }
                
                let energiaClass = 'status-normal';
                let energiaText = 'Normal';
                if (totalClients > 0 && energyOff > 0) {
                    const percEnergy = energyOff / totalClients;
                    if ((percEnergy >= 0.5 && energyOff >= 10) || (percEnergy === 1 && totalClients >= 5)) {
                        energiaClass = 'status-critico';
                        energiaText = 'Crítico';
                    } else if (percEnergy >= 0.15 && energyOff >= 5) {
                        energiaClass = 'status-atencao';
                        energiaText = 'Atenção';
                    } else {
                        energiaClass = 'status-atencao';
                        energiaText = 'Atenção';
                    }
                }

                let potMedia = pd.validPowerCount > 0 ? (pd.sumPower / pd.validPowerCount).toFixed(1) : 0;
                let potClass = 'status-normal';
                if (potMedia !== 0) {
                    if (potMedia <= -28.0) potClass = 'status-critico';
                    else if (potMedia <= -26.0) potClass = 'status-atencao';
                }
                
                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:bold;">Porta ${String(pt).padStart(2, '0')}</td>
                        <td>
                            <span class="circuit-badge circuit-clickable" style="cursor: pointer;" onclick="Dashboard360Engine.openCircuitClients('${pt}', '${safeInfo}')" title="Ver clientes deste circuito">
                                ${circuito}
                            </span>
                        </td>
                        <td style="color:var(--m3-on-surface-variant); font-size: 0.9rem;">${bairro}</td>
                        <td style="text-align: center;"><span class="status ${redeStatusClass}">${redeStatusText}</span></td>
                        <td style="text-align: center;"><span class="status ${energiaClass}">${energiaText}</span></td>
                        <td style="text-align: center;"><span class="status ${potClass}">${potMedia !== 0 ? potMedia + ' dBm' : 'N/A'}</span></td>
                    </tr>
                `;
            });
        }, 50);
    },

    openCircuitClients: function(porta, circuitoNome) {
        let modal = document.getElementById('client-modal-360');
        if (!modal) {
            const modalHTML = `
                <div id="client-modal-360" class="modal-overlay" style="display: none; z-index: 4000;" onclick="Dashboard360Engine.closeClientModal(event)">
                    <div class="modal-content modal-large">
                        <div class="modal-header">
                            <h3 id="client-modal-title" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-rounded">manage_search</span> Pesquisa de Clientes
                            </h3>
                            <button class="close-modal" onclick="Dashboard360Engine.closeClientModal()" title="Fechar">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="filter-bar">
                                <input type="text" id="client-search-input" class="filter-input" placeholder="Buscar por Serial ou Código..." onkeyup="Dashboard360Engine.filterClients()">
                                <select id="client-status-filter" class="filter-select" onchange="Dashboard360Engine.filterClients()">
                                    <option value="all">Todos Status</option>
                                    <option value="online">Online (UP)</option>
                                    <option value="offline">Offline (DOWN)</option>
                                </select>
                            </div>
                            <div class="table-container">
                                <table class="noc-table">
                                    <thead>
                                        <tr class="table-header-row">
                                            <th style="text-align: left;">OLT</th>
                                            <th style="text-align: center;">Placa/Porta</th>
                                            <th style="text-align: left;">Circuito</th>
                                            <th style="text-align: left;">Serial</th>
                                            <th style="text-align: left;">Código</th>
                                            <th style="text-align: center;">Rede</th>
                                            <th style="text-align: center;">Energia</th>
                                            <th style="text-align: center;">Potência</th>
                                        </tr>
                                    </thead>
                                    <tbody id="client-tbody-360"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('client-modal-360');
        }

        const textoCircuito = (circuitoNome && circuitoNome !== "-") ? ` - Circuito: ${circuitoNome}` : "";
        document.getElementById('client-modal-title').innerHTML = `<span class="material-symbols-rounded">manage_search</span> Placa ${this.currentPlaca} / Porta ${porta}${textoCircuito}`;
        
        document.getElementById('client-search-input').value = '';
        document.getElementById('client-status-filter').value = 'all';

        const tbody = document.getElementById('client-tbody-360');
        tbody.innerHTML = '';

        const clients = this.clientsData[porta] || [];

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhum cliente encontrado.</td></tr>`;
        } else {
            let energyOff = 0;
            if (window.ENERGY_DATA_STORE?.olts?.[this.currentOlt]?.ports?.[this.currentPlaca]?.[porta]) {
                energyOff = window.ENERGY_DATA_STORE.olts[this.currentOlt].ports[this.currentPlaca][porta].powerOff || 0;
            }

            clients.forEach(c => {
                let redeClass = c.isOnline ? 'filter-online status-normal' : 'filter-offline status-critico';
                let redeText = c.isOnline ? 'UP' : 'DOWN';

                let potClass = 'status-normal';
                let potDisplay = c.potenciaStr ? `${c.potenciaStr} dBm` : 'N/A';
                if (c.potenciaNum !== null) {
                    if (c.potenciaNum <= -28.0) potClass = 'status-critico';
                    else if (c.potenciaNum <= -26.0) potClass = 'status-atencao';
                }

                let energiaClass = 'status-normal';
                let energiaText = 'OK';
                
                if (!c.isOnline && energyOff > 0) {
                    energiaClass = 'status-atencao';
                    energiaText = 'Verificar';
                    energyOff--; 
                }

                let rowHTML = `
                    <tr class="client-row-360 ${c.isOnline ? 'filter-online' : 'filter-offline'}" data-serial="${c.serial}" data-codigo="${c.codigo}">
                        <td style="padding: 15px; color: var(--m3-on-surface-variant);">${this.currentOlt}</td>
                        <td style="text-align: center; color: var(--m3-on-surface-variant);">${this.currentPlaca}/${porta}</td>
                        <td style="color: var(--m3-on-surface-variant);">${circuitoNome}</td>
                        <td style="font-family: var(--font-family-mono); font-weight: 600; color: var(--m3-on-surface);">${c.serial || 'N/A'}</td>
                        <td style="font-family: var(--font-family-mono);">${c.codigo || 'N/A'}</td>
                        <td style="text-align: center;">
                            <span class="status ${redeClass}">${redeText}</span>
                        </td>
                        <td style="text-align: center;">
                            <span class="status ${energiaClass}">${energiaText}</span>
                        </td>
                        <td style="text-align: center; font-family: var(--font-family-mono);">
                            <span class="status ${potClass}">${potDisplay}</span>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += rowHTML;
            });
        }
        modal.style.display = 'flex';
    },

    filterClients: function() {
        const searchText = document.getElementById('client-search-input').value.toLowerCase().trim();
        const statusFilter = document.getElementById('client-status-filter').value;
        const rows = document.querySelectorAll('.client-row-360');
        
        rows.forEach(row => {
            const serial = (row.dataset.serial || '').toLowerCase();
            const codigo = (row.dataset.codigo || '').toLowerCase();
            
            let matchesSearch = searchText === '' || serial.includes(searchText) || codigo.includes(searchText);
            
            let matchesStatus = true;
            if (statusFilter === 'online') matchesStatus = row.classList.contains('filter-online');
            if (statusFilter === 'offline') matchesStatus = row.classList.contains('filter-offline');
            
            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    closeClientModal: function(event) {
        if (event && event.target.id !== 'client-modal-360' && !event.target.classList.contains('close-modal')) return;
        const modal = document.getElementById('client-modal-360');
        if (modal) modal.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => Dashboard360Engine.init());