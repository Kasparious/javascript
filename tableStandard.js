// -----------------------------------------------------------------------------------
// Programa                : tableStandard.js
// Autor                   : Kasparious
// Data de criação         : 202409
// Data última modificação : 
// Descrição               : Menu de contexto para tabelas com ícones dinâmicos
// Entradas                : tableId (id da tabela alvo)
// Saídas                  : Exibição e execução de ações de menu de contexto
// Algoritmos              : diversos
// Limitações              : Testes Chrome / Firefox / Edge
// -----------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    const themeBtn = document.getElementById('theme-btn');
    // const insertBtn = document.getElementById('insert-btn');
    const tableBody = document.getElementById('table-body');
    const table = document.getElementById('data-table');
    const tableHead = document.getElementById('table-head');
    let selectedRow = null; // Variável global para armazenar a linha selecionada

    const state = {
        darkMode: document.body.classList.contains('dark-theme'),
        tableData: [],
        currentSortColumn: null,
        isAscending: true,
        isEditing: false,
        editingRow: null,
    };

    themeBtn.textContent = state.darkMode ? '☀️' : '🌙';
    themeBtn.addEventListener('click', toggleTheme);

    fetchData('output_data.json')
        .then(data => {
//            state.tableData = data;
            populateTable();
            initializeContextMenu('table-body');
        })
        .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

    // insertBtn.addEventListener('click', insertRow);

    document.addEventListener('actionSelected', handleActionSelected);

    tableBody.addEventListener('dblclick', (e) => {
        if (!state.isEditing && e.target.tagName === 'TD') {
            const row = e.target.closest('tr');
            const cell = e.target; // Captura a célula clicada
            startEdit(row, cell); // Passa a célula clicada para a função startEdit
        }
    });
    
//-------------------------------------------------------------------------------------------------------
    function toggleTheme() {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-theme', state.darkMode);
        document.body.classList.toggle('light-theme', !state.darkMode);
        themeBtn.textContent = state.darkMode ? '☀️' : '🌙';
    }

//-------------------------------------------------------------------------------------------------------
    function fetchData(url) {
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                state.tableData = data;
                state.indexMap = {}; // Inicializa o indexMap

                // Cria o indexMap enquanto itera sobre os dados
                data.forEach((row, index) => {
                    state.indexMap[row.id] = index;
                });

                return data;
            });
    }
    //-------------------------------------------------------------------------------------------------------
    function handleActionSelected(event) {
        const { action, row } = event.detail;
        console.log('Ação: ', action); // Verifica a ação
        console.log('Linha: ', row); // Verifica o índice da linha
        
//        if (state.isEditing && action !== 'cancelar') return; // Impede mudanças enquanto edita, exceto 'cancelar'
    
        switch (action) {
            case 'inserir':
                insertRow();
                break;
            case 'excluir':
                excluirLinha(row);
                break;
            case 'editar':
                startEdit(row);
                break;
            case 'importar':

                break;
            case 'exportar':
                exportTableToCSV();
                break;
            case 'imprimir':
                printTable();
                break;
        }
    }    

//-------------------------------------------------------------------------------------------------------
function importarCSV() {
    // Criar e configurar o input de arquivo
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none'; // Esconde o input
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target.result;
            processCSV(csvData);
        };
        reader.readAsText(file);
    });

    // Acionar a caixa de diálogo para seleção do arquivo
    fileInput.click();
}

function processCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        mostrarMensagem('Erro: O arquivo CSV está vazio.');
        return;
    }

    const headers = lines[0].split(',');
    const tableHeaders = Array.from(tableHead.querySelectorAll('th')).slice(0, -1); // Exclui a coluna de ações
    if (headers.length !== tableHeaders.length) {
        mostrarMensagem('Erro: O número de colunas do arquivo CSV não corresponde à tabela.');
        return;
    }

    const tableData = lines.slice(1).map(line => line.split(','));

    // Adicionar as linhas à tabela
    tableData.forEach(row => {
        if (row.length === headers.length) { // Verificar se a linha tem o número correto de colunas
            addRowToTable(row);
        }
    });

    mostrarMensagem(`Importação concluída: ${tableData.length} linhas importadas.`);
}


//-------------------------------------------------------------------------------------------------------
function printTable() {
    const printContent = document.querySelector('table').outerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Imprimir Tabela</title>');
    printWindow.document.write('<style>table {width: 100%; border-collapse: collapse;} th, td {border: 1px solid black; padding: 8px;}</style>');
    printWindow.document.write('</head><body >');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print(); // Abre o diálogo de impressão do navegador
}

// Listener para o item do menu "Imprimir"
document.getElementById('printMenuOption').addEventListener('click', () => {
    printTable(); // Chama a função para imprimir
});

//-------------------------------------------------------------------------------------------------------
// Função para exportar a tabela para CSV (mesma função já implementada)
function exportTableToCSV() {
    let csvContent = '';
    const separator = ';'; // Usar ';' como separador

    // Obter a tabela e suas linhas
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tr');

    // Obter o cabeçalho da tabela e adicionar ao CSV
    const headers = table.querySelectorAll('th');
    const headerData = [];
    headers.forEach(header => {
        headerData.push(header.textContent.trim());
    });
    csvContent += headerData.join(separator) + '\n'; // Cabeçalho CSV

    // Iterar sobre as linhas da tabela e coletar os dados
    rows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.textContent.trim()); // Adiciona o conteúdo da célula
        });

        // Adicionar ao conteúdo CSV, ignorando linhas vazias
        if (rowData.length > 0) {
            csvContent += rowData.join(separator) + '\n';
        }
    });

    // Criar um Blob com os dados CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Criar um link para download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'tabela_exportada.csv'; // Nome do arquivo
    document.body.appendChild(downloadLink);

    // Simular o clique no link para iniciar o download
    downloadLink.click();

    // Remover o link após o download
    document.body.removeChild(downloadLink);
}

// Listener para o item do menu "Exportar CSV"
document.getElementById('exportMenuOption').addEventListener('click', () => {
    exportTableToCSV(); // Inicia o processo de exportação diretamente
});

//-------------------------------------------------------------------------------------------------------
// Listener para o clique no link/ícone de exportação
document.getElementById('exportLink').addEventListener('click', (event) => {
    event.preventDefault(); // Evita o comportamento padrão do link
    exportTableToCSV(); // Chama a função de exportação
});

//-------------------------------------------------------------------------------------------------------
function duplicarLinha(row) {
    // Obtém o índice da linha a partir do elemento da tabela
    const rowIndex = state.tableData.findIndex(item => item.id === row.dataset.id); // Assumindo que cada linha tem um atributo 'data-id' com o ID correspondente
  
    // Verifica se o índice é válido e se a linha já não é uma cópia
    if (rowIndex === -1 || !row.dataset.isOriginal) {
      console.error('Erro: Linha inválida para duplicação.');
      return;
    }
  
    // Cria uma cópia profunda da linha original
    const novaLinha = _.cloneDeep(state.tableData[rowIndex]);
  
    // Remove o atributo isOriginal da nova linha
    delete novaLinha.isOriginal;
  
    // Adiciona a nova linha aos dados e à tabela
    state.tableData.splice(rowIndex + 1, 0, novaLinha);
    populateTable();
  }


//-------------------------------------------------------------------------------------------------------
// Listener para duplicar a linha selecionada
document.getElementById('contextDuplicate').addEventListener('click', () => {
    if (selectedRow) {
        duplicarLinha(selectedRow); // Usa a função duplicarLinha
        closeContextMenu(); // Fecha o menu de contexto e remove o destaque da linha
    }
});

//-------------------------------------------------------------------------------------------------------
    function insertRow() {
        if (state.isEditing) return;

        state.isEditing = true;
        const newRow = createNewRowTemplate();
        tableBody.appendChild(newRow);
        newRow.querySelector('input').focus();

        // Adiciona listener para o ESC e ENTER na nova linha
        newRow.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelNewRow(newRow);
            } else if (e.key === 'Enter') {
                saveNewRow(newRow);
            }
        });
    }

//-------------------------------------------------------------------------------------------------------
    function createNewRowTemplate() {
        const newRow = document.createElement('tr');
        newRow.classList.add('new-row');

        const headers = Object.keys(state.tableData[0] || {});
        headers.forEach(() => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            td.appendChild(input);
            newRow.appendChild(td);
        });

        const actionTd = document.createElement('td');
        const saveIcon = createIcon('💾', 'Salvar', () => saveNewRow(newRow));
        const cancelIcon = createIcon('❌', 'Cancelar', () => cancelNewRow(newRow));
        actionTd.appendChild(saveIcon);
        actionTd.appendChild(cancelIcon);
        newRow.appendChild(actionTd);

        return newRow;
    }

//-------------------------------------------------------------------------------------------------------
    function saveNewRow(newRow) {
        const inputs = newRow.querySelectorAll('input');
        const newRowData = {};
        const headers = Object.keys(state.tableData[0] || {});

        let isEmpty = true;

        inputs.forEach((input, index) => {
            const value = input.value.trim();
            newRowData[headers[index]] = value;

            // Verifica se pelo menos uma célula tem conteúdo
            if (value) {
                isEmpty = false;
            }
        });

        if (isEmpty) {
            alert('Não é permitido inserir uma linha em branco.');
            return;
        }

        state.tableData.push(newRowData);
        state.isEditing = false;
        populateTable();
    }

//-------------------------------------------------------------------------------------------------------
    function cancelNewRow(newRow) {
        newRow.remove();
        state.isEditing = false;
    }

//-------------------------------------------------------------------------------------------------------
    function excluirLinha(row) {
        const rowIndex = Array.from(tableBody.rows).indexOf(row);
        if (rowIndex >= 0) {
            state.tableData.splice(rowIndex, 1);
            populateTable();
        }
    }

//-------------------------------------------------------------------------------------------------------
    function startEdit(row, cellToFocus = null) {
        if (state.isEditing) return;
        state.isEditing = true;
        state.editingRow = row;
    
        const cells = row.querySelectorAll('td:not(:last-child)');
        const originalData = [];
    
        cells.forEach((cell, index) => {
            originalData[index] = cell.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell.textContent;
            cell.textContent = '';
            cell.appendChild(input);
//
            // if (cell.classList.contains('action-cell')) {
            //     continue; // Ignora a célula de ação
            // }
//
            // Coloca o foco na célula que foi clicada
            if (cell === cellToFocus) {s
                input.focus();
            }
        });

        const actionTd = document.createElement('td'); // Nova célula para os ícones
        row.appendChild(actionTd);
      
        const saveIcon = createIcon('💾', 'Salvar', () => saveEditRow(row, originalData));
        const cancelIcon = createIcon('❌', 'Cancelar', () => cancelEditRow());
      
        actionTd.appendChild(saveIcon);
        actionTd.appendChild(cancelIcon);

    
        // Adiciona o comportamento para ESC e ENTER durante a edição
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEditRow();
            } else if (e.key === 'Enter') {
                saveEditRow(row, originalData);
            }
        });
    }

//-------------------------------------------------------------------------------------------------------
    function saveEditRow(row, originalData) {
        const inputs = row.querySelectorAll('input');
        const rowIndex = Array.from(tableBody.rows).indexOf(row);
        const headers = Object.keys(state.tableData[0]);

        inputs.forEach((input, index) => {
            const value = input.value.trim();
            row.cells[index].textContent = value;
            state.tableData[rowIndex][headers[index]] = value;
        });

        resetRowAfterEdit(row);
    }

//-------------------------------------------------------------------------------------------------------
    function cancelEditRow() {
        if (!state.editingRow) return;

        const row = state.editingRow;
        const rowIndex = Array.from(tableBody.rows).indexOf(row);
        const headers = Object.keys(state.tableData[0]);

        row.querySelectorAll('input').forEach((input, index) => {
            row.cells[index].textContent = state.tableData[rowIndex][headers[index]];
        });

        resetRowAfterEdit(row);
    }

//-------------------------------------------------------------------------------------------------------
    function resetRowAfterEdit(row) {
// remover célula adicionada para edição
        const actionCell = row.querySelector('.action-cell');
        if (actionCell) {
          row.removeChild(actionCell);
        }
//
        const actionTd = row.querySelector('td:last-child');
        actionTd.innerHTML = '';
//        createActionIcons(actionTd, row);

        state.isEditing = false;
        state.editingRow = null;
    }

//-------------------------------------------------------------------------------------------------------
    function createIcon(symbol, title, callback) {
        const icon = document.createElement('span');
        icon.textContent = symbol;
        icon.style.cursor = 'pointer';
        icon.title = title;
        icon.addEventListener('click', callback);
        return icon;
    }

//-------------------------------------------------------------------------------------------------------
    function createActionIcons(actionTd, row) {
        const editIcon = createIcon('✏️', 'Editar', () => startEdit(row));
        const deleteIcon = createIcon('🗑️', 'Excluir', () => excluirLinha(row));

        actionTd.appendChild(editIcon);
        actionTd.appendChild(deleteIcon);
    }

//-------------------------------------------------------------------------------------------------------
    // function populateTable() {
    //     tableHead.innerHTML = '';
    //     tableBody.innerHTML = '';
    //     if (state.tableData.length > 0) {
    //         const headers = Object.keys(state.tableData[0]);
    //         const headerRow = document.createElement('tr');
    //         headers.forEach((header, index) => {
    //             const th = document.createElement('th');
    //             th.textContent = header;
    //             th.style.cursor = 'pointer';
    //             th.addEventListener('click', () => sortTableByColumn(index));
    //             headerRow.appendChild(th);
    //         });
    //         const thActions = document.createElement('th');
    //         thActions.textContent = "Ações";
    //         headerRow.appendChild(thActions);
    //         tableHead.appendChild(headerRow);
    //         headerRow.appendChild(document.createElement('th'));
    //         tableHead.appendChild(headerRow);
    //         state.tableData.forEach(rowData => {
    //             const tr = document.createElement('tr');
    //             tr.dataset.isOriginal = true; // Adiciona o atributo à linha original
    //             Object.values(rowData).forEach(value => {
    //                 const td = document.createElement('td');
    //                 td.textContent = value;
    //                 td.setAttribute('data-tooltip', value);
    //                 tr.appendChild(td);
    //             });
    //             const actionTd = document.createElement('td');
    //             createActionIcons(actionTd, tr);
    //             tr.appendChild(actionTd);
    //             tableBody.appendChild(tr);
    //         });
    //     }
    // }
function populateTable() {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (state.tableData.length > 0) {
        const headers = Object.keys(state.tableData[0]);
        const headerRow = document.createElement('tr');
        
        // Criar os cabeçalhos (exceto "Ações")
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortTableByColumn(index));
            headerRow.appendChild(th);
        });
        
        // Adicionar a linha de cabeçalho na tabela
        tableHead.appendChild(headerRow);

        // Popula as linhas da tabela
        state.tableData.forEach(rowData => {
            const tr = document.createElement('tr');
            tr.dataset.isOriginal = true; // Adiciona o atributo à linha original
            
            Object.values(rowData).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                td.setAttribute('data-tooltip', value);
                tr.appendChild(td);
            });
            
            // Não cria a célula de ações
            tableBody.appendChild(tr);
        });
    }
}


//-------------------------------------------------------------------------------------------------------
    function sortTableByColumn(index) {
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        const isAscending = state.currentSortColumn === index ? !state.isAscending : true;

        rows.sort((a, b) => {
            const aText = a.cells[index].textContent.trim();
            const bText = b.cells[index].textContent.trim();

            return isAscending
                ? aText.localeCompare(bText, undefined, { numeric: true })
                : bText.localeCompare(aText, undefined, { numeric: true });
        });

        state.currentSortColumn = index;
        state.isAscending = isAscending;
        rows.forEach(row => tableBody.appendChild(row));

        updateSortIndicators();
    }

//-------------------------------------------------------------------------------------------------------
    function updateSortIndicators() {
        tableHead.querySelectorAll('th').forEach((th, index) => {
            th.classList.toggle('sorted-asc', state.currentSortColumn === index && state.isAscending);
            th.classList.toggle('sorted-desc', state.currentSortColumn === index && !state.isAscending);
        });
    }

//-------------------------------------------------------------------------------------------------------
    function initializeContextMenu(elementId) {
        const element = document.getElementById(elementId);

        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const menu = document.getElementById('context-menu');
            menu.style.display = 'block';
            menu.style.left = `${e.pageX}px`;
            menu.style.top = `${e.pageY}px`;

            // Capture the clicked row to apply actions on it
            const clickedRow = e.target.closest('tr');

            const actionItems = menu.querySelectorAll('li');
            actionItems.forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.getAttribute('data-action');
                    dispatchCustomEvent(action, clickedRow);
                });
            });

            document.addEventListener('click', () => menu.style.display = 'none');
        });
    }

    function dispatchCustomEvent(action, row) {
        const event = new CustomEvent('actionSelected', {
            detail: { action, row },
        });
        document.dispatchEvent(event);
    }

//-------------------------------------------------------------------------------------------------------
// Menu de contexto - abrir ao clicar com botão direito
tableBody.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const targetRow = e.target.closest('tr');

    if (targetRow) {
        // Remover highlight de qualquer linha anterior
        if (selectedRow) {
            selectedRow.classList.remove('highlight');
        }

        selectedRow = targetRow;
        selectedRow.classList.add('highlight'); // Adicionar highlight na linha clicada

        // Exibir o menu de contexto
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;

        // Impedir ações em outras células
        tableBody.style.pointerEvents = 'none';
        selectedRow.style.pointerEvents = 'auto'; // Permitir apenas na linha selecionada
    }
});

//-------------------------------------------------------------------------------------------------------
// Listener global para fechar o menu ao clicar fora dele
document.addEventListener('click', (e) => {
    if (e.button !== 2) { // Verifica se não é o botão direito
        // Verifica se o clique foi fora da tabela e do menu de contexto
        if (!contextMenu.contains(e.target) && !tableBody.contains(e.target)) {
            closeContextMenu(); // Fecha o menu de contexto
        }
    }
});

//-------------------------------------------------------------------------------------------------------
document.getElementById('contextInsert').addEventListener('click', () => {
    if (selectedRow) {
        const newRow = tableBody.insertRow(selectedRow.rowIndex + 1);
        for (let i = 0; i < selectedRow.cells.length; i++) {
            const newCell = newRow.insertCell(i);
            newCell.textContent = ''; // Preenche a célula com vazio
        }
        closeContextMenu(); // Fecha o menu de contexto e remove o destaque da linha
    }
});

//-------------------------------------------------------------------------------------------------------
// Listener para excluir a linha selecionada
document.getElementById('contextDelete').addEventListener('click', () => {
    if (selectedRow) {
        tableBody.deleteRow(selectedRow.rowIndex); // Exclui a linha selecionada
        closeContextMenu(); // Fecha o menu de contexto e remove o destaque da linha
    }
});

//-------------------------------------------------------------------------------------------------------
// Função para fechar o menu de contexto e remover o highlight
function closeContextMenu() {
    contextMenu.style.display = 'none'; // Fecha o menu de contexto
    tableBody.style.pointerEvents = 'auto'; // Reabilitar o ponteiro para o corpo da tabela


    // Remover o highlight da linha selecionada, se houver
    if (selectedRow) {
        selectedRow.classList.remove('highlight');
    }
    selectedRow = null; // Resetar a variável
}
//-------------------------------------------------------------------------------------------------------
// Listener para fechar o menu de contexto ao pressionar a tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { // Verifica se a tecla ESC foi pressionada
        closeContextMenu(); // Fecha o menu de contexto
    }
});

//-------------------------------------------------------------------------------------------------------
document.addEventListener('actionSelected', (event) => {
    const { action, row } = event.detail; // 'row' corresponde ao índice da linha, como esperado
    console.log('Ação recebida:', action); // Verifica a ação
    console.log('Índice da linha recebida:', row); // Verifica o índice da linha
    
    handleActionSelected({ action, row }); // Passa a ação e o índice da linha para o próximo manipulador
});

}
