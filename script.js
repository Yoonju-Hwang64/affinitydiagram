let apiKey = "";

function setApiKey() {
    apiKey = document.getElementById('apiKeyInput').value; 
    alert('API 키가 설정되었습니다.');
}


const endpoint = "https://api.openai.com/v1/chat/completions";

let notes = [];
let groups = [];
let noteIndex = 0;
let selectedNote = null;

let isSelecting = false;
let selectionStartX, selectionStartY;
let $selectionBox;

// 로딩 스피너를 보여주는 함수
function showLoadingSpinner() {
    document.querySelector('.loading-container').style.display = 'flex';
}

// 로딩 스피너를 숨기는 함수
function hideLoadingSpinner() {
    document.querySelector('.loading-container').style.display = 'none';
}

// callGPT([질문], [콜백 함수])
function callGPT(prompt, callback) {
    if (!apiKey) {  // API 키가 설정되지 않은 경우 경고
        alert("API 키를 먼저 설정해주세요.");
        return;
    }
   
    $.ajax({
        url: endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        data: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: prompt
            }]
        }),
        success: function(data) {
            hideLoadingSpinner(); // 로딩 스피너 숨기기
            if (callback) callback(data.choices[0].message.content);
        },
        error: function() {
            hideLoadingSpinner(); // 로딩 스피너 숨기기
            alert("Error occurred while calling GPT");
        }
    });
}

// 노트를 화면에 추가하는 함수
function addNoteToDisplay(note) {
    noteIndex++;
    const $noteElement = $('<div>')
        .addClass('note')
        .attr('id', 'note-' + `${noteIndex}`)
        .text(note.text)
        .attr('contenteditable', 'true') // 노트 수정 가능
        .css('background-color', note.color || '') // 노트의 색상 설정
        .dblclick(function() {
            applySimilarityColors(note);
        })
        .click(function(event) {
            event.stopPropagation(); // 이벤트 전파 중지
            // 선택된 노트 저장
            selectedNote = $(this);
            $('.note').removeClass('selected');
            $(this).addClass('selected');

            // floatBtn2 표시
            const floatBtn2 = $('.floatBtn2');
            floatBtn2.css({
                display: 'flex',
                top: event.pageY - floatBtn2.outerHeight() - 10 + 'px',
                left: event.pageX - (floatBtn2.outerWidth() / 2) + 'px'
            });
            updateFontSizeButton();
        });
    // 노트가 노란색이라면 z-index를 1000으로 설정
    if (note.color === 'yellow' || note.color === '#FFFF00') {
        $noteElement.css('z-index', 10000);
    }
    $('#notes').append($noteElement);

    // 노트를 화면 중앙에 배치
    const notesContainerWidth = $('#notes').width();
    const noteWidth = $noteElement.outerWidth();
    const leftPosition = (notesContainerWidth / 2) - (noteWidth / 2);
    $noteElement.css('left', leftPosition + 'px');

    // 드래그 가능하게 설정
    makeNoteDraggable($noteElement);
}

// 노트 클릭 시 floatBtn2 표시
const $floatBtn2 = $('.floatBtn2');
$(document).on('click', '.note', function(event) {
    event.stopPropagation(); // 이벤트 전파 중지
    const $note = $(this);

    // 선택된 노트 저장
    selectedNote = $note;
    $('.note').removeClass('selected');
    $note.addClass('selected');

    // floatBtn2 위치 조정 및 표시
    $floatBtn2.css({
        display: 'flex',
        top: event.pageY - $floatBtn2.outerHeight() - 10 + 'px',
        left: event.pageX - ($floatBtn2.outerWidth() / 2) + 'px'
    });
});

// 드래그 가능하게 설정하는 함수
function makeNoteDraggable($noteElement) {
    interact($noteElement[0]).draggable({
        onmove: dragMoveListener,
        onend: function (event) {
            var target = $(event.target);
            var wasDropped = false;

            $('.group-container .notes').each(function () {
                var $notesSection = $(this);
                var offset = $notesSection.offset();
                var width = $notesSection.outerWidth();
                var height = $notesSection.outerHeight();

                if (
                    event.pageX > offset.left &&
                    event.pageX < offset.left + width &&
                    event.pageY > offset.top &&
                    event.pageY < offset.top + height
                ) {
                    // 노트를 새로운 그룹으로 이동
                    $notesSection.append(target);
                    wasDropped = true;
                    return false; // break the loop
                }
            });

            if (!wasDropped) {
                // 노트가 그룹 영역 밖으로 드랍되면 원래 자리로 돌아가게 하려면 아래 코드 추가
                var x = (parseFloat(target.attr('data-x')) || 0);
                var y = (parseFloat(target.attr('data-y')) || 0);
                target.css('transform', 'translate(' + x + 'px, ' + y + 'px)');
            } else {
                // 새로운 그룹으로 노트를 이동시켰을 때, 노트 위치 초기화
                target.css('transform', 'translate(0px, 0px)');
                target.attr('data-x', 0);
                target.attr('data-y', 0);
            }
        }
    });
}

// colorContainer 토글
$('#colortoggle').on('click', function() {
    var $colorContainer = $('.colorContainer');

    // colorContainer의 현재 display 속성 확인 및 토글
    if ($colorContainer.css('display') === 'none') {
        $colorContainer.css('display', 'flex');
    } else {
        $colorContainer.css('display', 'none');
    }
    // floatBtn2는 항상 표시 상태로 유지
    $('.floatBtn2').css('display', 'flex');
});

// colorContainer 버튼 클릭 시 노트 색상 변경
$(document).on('click', '.color-btn', function() {
    if (selectedNote) {
        const color = $(this).css('background-color');
        selectedNote.css('background-color', color);
    }
});

// fontWeight 버튼 클릭 시 선택된 노트의 글씨를 굵게 변경
$('#fontWeight').on('click', function() {
    if (selectedNote) {
        if (selectedNote.css('font-weight') === 'bold' || selectedNote.css('font-weight') === '700') {
            selectedNote.css('font-weight', 'normal');
        } else {
            selectedNote.css('font-weight', 'bold');
        }
    }
});

//폰트 사이즈 조절하기
document.getElementById('fontSize').addEventListener('click', function() {
    var dropdown = document.getElementById('fontSizeDropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        if (selectedNote) {
            var fontSize = window.getComputedStyle(selectedNote[0]).fontSize;
            document.querySelectorAll('#fontSizeDropdown .FS').forEach(function(item) {
                item.classList.remove('chosen');
                if (item.getAttribute('data-size') === fontSize) {
                    item.classList.add('chosen');
                }
            });
        }
        dropdown.style.display = 'flex';
    } else {
        dropdown.style.display = 'none';
    }
    $('.floatBtn2').css('display', 'flex');
});

document.querySelectorAll('#fontSizeDropdown .FS').forEach(function(item) {
    item.addEventListener('click', function() {
        var newSize = this.getAttribute('data-size');
        if (selectedNote) {
            selectedNote.css('font-size', newSize); // jQuery를 사용하여 스타일 변경
            updateFontSizeButton(); // #fontSize 버튼 텍스트 업데이트
        }
        document.getElementById('fontSizeDropdown').style.display = 'none';
    });
});

function updateFontSizeButton() {
    if (selectedNote) {
        var fontSize = window.getComputedStyle(selectedNote[0]).fontSize; // DOM 요소 사용
        document.getElementById('fontSize').innerText = fontSize.replace('px', '');
    }
    $('.floatBtn2').css('display', 'flex');
}
if (selectedNote) {
    updateFontSizeButton();
}

//그룹핑 후 클러스터링
$('#groups').on('dblclick', '.note', function() {
    console.log('노트더블클릭')
    let noteContent = $(this).text();
    applySimilarityColors2(noteContent);
});

//그룹별 클러스터링
$('#groups').on('dblclick', '.group-title', function() {
    console.log('헤더더블클릭')
    let noteContent = $(this).text(); // 클릭된 .note의 내용을 가져옵니다.
    applySimilarityColors3(noteContent);
});


//프랑켄슈타인
function applySimilarityColors(selectedNote) {
    const texts = notes.map(note => note.text);
    getSimilarities(selectedNote.text, texts).then(similarities => {
        similarities.forEach((similarity, index) => {
            const intensity = Math.floor((1 - similarity) * 255);
            const color = `rgb(255, 255, ${intensity})`;
            $('#note-' + notes[index].id).css('background-color', color);
        });
    });
}

//그룹핑 후 프랑켄슈타인
function applySimilarityColors2(selectedNote) {
    const texts = notes.map(note => note.text);

    getSimilarities(selectedNote, texts).then(similarities => {
        similarities.forEach((similarity, index) => {
            const intensity = Math.floor((1 - similarity) * 255);
            const color = `rgb(255, 255, ${intensity})`;
            $('#groupnote-' + notes[index].id).css('background-color', color);
        });
    });
}

//그룹별 프랑켄슈타인
function applySimilarityColors3(selectedNote) {
    const groupTitles = document.querySelectorAll('.group-title');
    const texts = Array.from(groupTitles).map(title => title.textContent);
    console.log("Texts for similarity check:", texts);

    getSimilarities(selectedNote, texts).then(similarities => {
        console.log("Calculated similarities:", similarities);
        similarities.forEach((similarity, index) => {
            const intensity = Math.floor((1 - similarity) * 255);
            const color = `rgb(255, ${intensity}, ${intensity})`;
            console.log(`Setting color for note ${notes[index].id}:`, color);
            $('#titlenote-' + notes[index].id).css('background-color', color);
        });
    });
}

//프랑켄슈타인 공통(본체)
async function getSimilarities(selectedText, texts) {
    if (!apiKey) {  // API 키가 설정되지 않은 경우 경고
        alert("API 키를 먼저 설정해주세요.");
        return;
    }
    
    const endpoint = 'https://api.openai.com/v1/embeddings';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: texts
        })
    });

    const data = await response.json();

    const embeddings = data.data.map(item => item.embedding);

    const selectedIndex = texts.indexOf(selectedText);
    const selectedEmbedding = embeddings[selectedIndex];

    const similarities = texts.map((_, i) => {
        const embedding = embeddings[i];
        return cosineSimilarity(selectedEmbedding, embedding);
    });

    return similarities;
}

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// GPT 그룹핑
function groupNotes() {
    const notesText = notes.map(note => note.text).join("\n");

    const prompt =
    `너는 UX/UI 디자이너야.
    노트의 핵심 내용이 비슷하면 유사한 노트이다.
    affinity diagram은 방대한 데이터들 사이에서 의미 있는 규칙을 발견하기 위한 그룹핑 기법이다.
    유사한 노트를 하나의 그룹으로 묶어 ${notesText}에 대한 affinity diagram을 제작한다.
    기존에 있는 내용을 누락하지 않는다.
    출력형식에 맞춰 답변을 출력한다.
    출력형식: - 그룹이름: - 그룹내용: - 그룹내용: - 그룹이름: - 그룹내용: - 그룹내용: - 그룹내용:`;

    callGPT(prompt, (response) => {
        console.log(response);
        $('#groups').empty();
        $('#notes').empty();
        addGroupToDisplay(response);
    });
}

// 선택된 노트들로 그룹핑 수행
$('#groupingNote').on('click', function() {
    const selectedNotes = $('.note.selected').map(function() {

        return $(this).text();
    }).get();

    if (selectedNotes.length >= 2) {
        groupSelectedNotes(selectedNotes);
        showLoadingSpinner();
    } else {
        alert("두 개 이상의 노트를 선택해주세요.");
    }
});

function groupSelectedNotes(selectedNotes) {
    const notesText = selectedNotes.join("\n");

    const prompt =
    `너는 UX/UI 디자이너야.
    노트의 핵심 내용이 비슷하면 유사한 노트이다.
    affinity diagram은 방대한 데이터들 사이에서 의미 있는 규칙을 발견하기 위한 그룹핑 기법이다.
    유사한 노트를 하나의 그룹으로 묶어 ${notesText}에 대한 affinity diagram을 제작한다.
    기존에 있는 내용을 누락하지 않는다.
    출력형식에 맞춰 답변을 출력한다.
    출력형식: - 그룹이름: - 그룹내용: - 그룹내용: - 그룹이름: - 그룹내용: - 그룹내용: - 그룹내용:`;

    callGPT(prompt, (response) => {
        console.log(response); 

        $('#groups').empty(); // 기존 그룹 초기화
        addGroupToDisplay(response); // 선택된 노트로 그룹 생성
        
        // #notes 안에서 selectedNotes 제거
        selectedNotes.forEach(note => {
            $('#notes').children().filter(function() {
                return $(this).text() === note;
            }).remove();
        });
    });
}

let globalNoteId = 1;

function addGroupToDisplay(response) {

    let groupTitleId = 1;  // 그룹 타이틀 ID 초기화

    const groups = response.split('- 그룹이름:').slice(1);
    groups.forEach(group => {
        const [title, ...notes] = group.split('- 그룹내용:');
        const trimmedNotes = notes.map(note => note.trim()).filter(note => note);

        const groupContainer = $('<div>').addClass('group-container');

        const insightContainer = $('<div>').addClass('insight-container visible');
        groupContainer.append(insightContainer);
        insightContainer.append("<p>인사이트</p>");
        groupContainer.append('<img class="insight-icon" src="./images/icon/insight_inactive.png" alt="#" width="48px">');

        const groupTitle = $('<div>').addClass('group-title').text(`${title.trim()}`)
            .attr('id', `titlenote-${groupTitleId++}`)
            .attr('contenteditable', 'true'); // 그룹 타이틀 수정 가능
        groupContainer.append(groupTitle);
        makeNoteDraggable(groupTitle);


        const notesSection = $('<div>').addClass('notes');
        trimmedNotes.forEach(note => {
            note.split('\n').forEach(line => {
                const noteText = line.trim();
                const noteDiv = $('<div>').addClass('note').text(noteText)
                    .attr('id', `groupnote-${globalNoteId++}`)
                    .attr('contenteditable', 'true'); // 노트 수정 가능
                notesSection.append(noteDiv);
                makeNoteDraggable(noteDiv);
            });
        });

        groupContainer.append(notesSection);
        $('#groups').append(groupContainer);
    });
}

// GPT 상위 헤더 추출
$('#headerExtraction').on('click', function() {
    showLoadingSpinner();
    let groupNotes = '';
    $('.group-container').each(function() {
        let title = $(this).find('.group-title').text();
        let notes = $(this).find('.note').map(function() {
            return $(this).text();
        }).get().join(' ');
        groupNotes += '그룹이름: ' + title + ' 그룹내용: ' + notes;
    });

    const prompt =
    `너는 UX/UI 디자이너고 affinity diagram을 진행 중이야.
    아래 그룹핑된 결과를 참고하여 공통된 내용을 기준으로 상위 헤더를 생성한다.
    각 그룹의 이름과 내용을 바탕으로 관련 있는 그룹을 묶어 상위 헤더 이름을 정하고 그 아래에 그룹들을 나열한다.
    상위 헤더 이름은 그룹의 공통점을 알 수 있게 짓는다.
    그룹을 중복되게 묶지 않는다.
    출력형식에 맞춰 답변을 출력한다.
    출력 형식: 
    상위헤더이름: - 그룹이름: - 그룹이름: 상위헤더이름: - 그룹이름:
    다음은 그룹핑 결과야: ${groupNotes}`;

    callGPT(prompt, function(response) {
        console.log(response);
        addHeaderToDisplay(response);
    });
});

// GPT 상위 헤더 추출 - 파싱 후 화면에 추가
function addHeaderToDisplay(response) {
    let $existingGroups = $('.group-container').clone();

    let lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let $groupsContainer = $('#groups');
    $groupsContainer.empty();

    let $currentTopContainer = null;

    lines.forEach(line => {
        if (line.startsWith('상위헤더이름:')) {
            if ($currentTopContainer) {
                $groupsContainer.append($currentTopContainer);
            }
            let header = line.replace('상위헤더이름: ', '').trim();
            $currentTopContainer = $('<div class="group-container-top"></div>');
            $currentTopContainer.append(`<div class="group-title-top" contenteditable="true">${header}</div>`);
        } else if (line.startsWith('- 그룹이름:')) {
            let groupName = line.replace('- 그룹이름: ', '').trim();
            let $existingGroup = $existingGroups.filter(`:has(.group-title:contains(${groupName}))`).clone();
            if ($currentTopContainer) {
                $currentTopContainer.append($existingGroup);
                $existingGroup.find('.note').each(function() {
                    makeNoteDraggable($(this));
                });
            }
        }
    });

    if ($currentTopContainer) {
        $groupsContainer.append($currentTopContainer);
    }
}

// 노트 정리 버튼을 클릭했을 때 중복 노트를 찾아 회색으로 변경하는 함수
$('#dataCleanup').on('click', function() {
    const notesText = notes.join("\n");
    showLoadingSpinner();

    const prompt =
    `너는 UX/UI 디자이너야.
    노트의 핵심 내용이 일치하면 유사한 노트이다.
    예를 들어, '너무 무거워서 불편하다'와 '많이 무겁다'는 유사한 노트로  간주한다.
    노트 데이터 중에서 유사한 노트를 찾는다.
    찾는 유사한 노트 중 첫 번째 노트를 제외하고 나머지 노트의 인덱스를 반환한다. 
    유사한 노트를 찾고 인덱스를 반환한다.
    출력형식에 맞춰 답변을 출력한다.
    노트 데이터: ${notes.map((note, index) => `${index + 1}. ${note}`).join("\n")}
    출력 형식: [중복된 노트의 인덱스들]`;

    callGPT(prompt, function(response) {
        try {
            const duplicateIndexes = response.match(/\d+/g).map(Number);
            duplicateIndexes.forEach(index => {
                $(`.note:eq(${index - 1})`).css('background-color', '#DEDEDE');
            });
        } catch (e) {
            console.error("Error parsing GPT response:", e);
        }
    });
});

// 인사이트 버튼을 클릭했을 때 각 그룹별로 핵심 이슈를 출력하는 함수
$('#insight').on('click', function() {
    showLoadingSpinner();
    $('#groups .group-container').each(function(index, element) {
        const groupName = $(element).find('.group-title').text();
        const notesText = $(element).find('.note').map(function() {
            return $(this).text();
        }).get().join('\n');

        const prompt =
        `너는 UX/UI 디자이너야.
        인사이트는 공통된 개선점이나 새롭게 알게 된 사실이다.
        인사이트는 구체적이고 실용적이어야 하며, 그룹의 주제와 관련성이 높아야 한다.
        그룹이름: ${groupName} 그룹내용: ${notesText}
        위 내용을 보고 인사이트를 한 문장으로 정리한다.
        출력형식에 맞게 답변을 출력한다.
        출력형식: 인사이트:`;

        callGPT(prompt, (response) => {
            console.log(response);
            const insightText = response.replace('인사이트:', '').trim();
            const $insightElement = $('<div>')
                .addClass('insight-note')
                .text(insightText)
                .attr('contenteditable', 'true');

            $(element).find('.insight-container').append($insightElement);
        });
    });
});

// 드래그 이동 처리기
function dragMoveListener(event) {
    var target = event.target;
    var x = (parseFloat($(target).attr('data-x')) || 0) + event.dx;
    var y = (parseFloat($(target).attr('data-y')) || 0) + event.dy;

    $(target).css('transform', 'translate(' + x + 'px, ' + y + 'px)');
    $(target).attr('data-x', x);
    $(target).attr('data-y', y);

    checkDistanceBetweenNotes();
}

// 버튼을 클릭했을 때 노트를 추가하는 이벤트 핸들러
$('#noteAdd').on('click', function() {
    let message = $('#noteInput').val();

    let messages = message.split('\n');

    messages.forEach(msg => {
        if (msg.trim() !== '') {
            const note = { id: notes.length + 1, text: msg.trim() };
            notes.push(note);
            addNoteToDisplay(note);
        }
    });

    $('#noteInput').val('');
});

// 그룹핑 버튼을 클릭했을 때 그룹핑을 수행하는 이벤트 핸들러
$('#group').on('click', function() {
    if (notes.length >= 5) {
        showLoadingSpinner(); // 그룹핑 시작 시 로딩 스피너 표시
        groupNotes();
    } else {
        alert("노트를 5개 이상 입력하세요.");
    }
});

//인사이트 보이기/숨기기
$('#groups').on('click', '.insight-icon', function() {
    const $icon = $(this);
    const $container = $icon.closest('.group-container').find('.insight-container');


    $container.toggleClass('visible');

    if ($container.hasClass('visible')) {
        $icon.attr('src', './images/icon/insight_inactive.png');
    } else {
        $icon.attr('src', './images/icon/insight_active.png');
    }
});

// 페이지 로드 시 선택 박스를 초기화하는 함수
$(document).ready(function() {
    $selectionBox = $('<div class="selection-box"></div>').appendTo('body');

    $(document).on('mousedown', function(event) {
        if ($(event.target).is('.note')) {
            return;
        }

        isSelecting = true;
        selectionStartX = event.pageX;
        selectionStartY = event.pageY;

        $selectionBox.css({
            left: selectionStartX + 'px',
            top: selectionStartY + 'px',
            width: 0,
            height: 0,
            display: 'block'
        });
    });

    $(document).on('mousemove', function(event) {
        if (!isSelecting) return;

        const currentX = event.pageX;
        const currentY = event.pageY;

        const width = Math.abs(currentX - selectionStartX);
        const height = Math.abs(currentY - selectionStartY);

        $selectionBox.css({
            width: width + 'px',
            height: height + 'px',
            left: Math.min(currentX, selectionStartX) + 'px',
            top: Math.min(currentY, selectionStartY) + 'px'
        });

        $('.note').each(function() {
            const $note = $(this);
            const noteOffset = $note.offset();
            const noteWidth = $note.outerWidth();
            const noteHeight = $note.outerHeight();

            const selectionBoxOffset = $selectionBox.offset();
            const selectionBoxWidth = $selectionBox.outerWidth();
            const selectionBoxHeight = $selectionBox.outerHeight();

            if (
                selectionBoxOffset.left < noteOffset.left + noteWidth &&
                selectionBoxOffset.left + selectionBoxWidth > noteOffset.left &&
                selectionBoxOffset.top < noteOffset.top + noteHeight &&
                selectionBoxOffset.top + selectionBoxHeight > noteOffset.top
            ) {
                $note.addClass('selected');
            } else {
                $note.removeClass('selected');
            }
        });
    });

    $(document).on('mouseup', function(event) {
        isSelecting = false;
        $selectionBox.hide();

        const selectedCount = $('.note.selected').length;

        if (selectedCount > 0) {
            if (selectedCount === 1) {
                $('.floatBtn2').css({
                    display: 'flex',
                    top: event.pageY - $('.floatBtn2').outerHeight() - 10 + 'px',
                    left: event.pageX - ($('.floatBtn2').outerWidth() / 2) + 'px'
                });
                $('.floatBtn3').hide();
            } else {
                $('.floatBtn3').css({
                    display: 'flex',
                    top: event.pageY - $('.floatBtn3').outerHeight() - 10 + 'px',
                    left: event.pageX - ($('.floatBtn3').outerWidth() / 2) + 'px'
                });
                $('.floatBtn2').hide();
            }
        } else {
            $('.floatBtn2').hide();
            $('.floatBtn3').hide();
        }
    });
});

//거리에 따른 노트 색상 그룹핑(class로 묶어주기)
function checkDistanceBetweenNotes() {
    let notes = $('.note');
    let closeGroups = [];
    let groupIndex = 0;

    notes.each(function() {
        $(this).removeClass(function(index, className) {
            return (className.match(/(^|\s)close-group-\S+/g) || []).join(' ');
        });
    });

    function areNotesClose(note1, note2) {
        let pos1 = note1.offset();
        let pos2 = note2.offset();

        let centerX1 = pos1.left + note1.outerWidth() / 2;
        let centerY1 = pos1.top + note1.outerHeight() / 2;
        let centerX2 = pos2.left + note2.outerWidth() / 2;
        let centerY2 = pos2.top + note2.outerHeight() / 2;

        let distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
        return distance < 140;
    }

    for (let i = 0; i < notes.length; i++) {
        let note1 = $(notes[i]);
        let group = closeGroups.find(group => group.some(note => areNotesClose(note, note1)));

        if (group) {
            group.push(note1);
        } else {
            closeGroups.push([note1]);
        }
    }

    closeGroups.forEach(group => {
        let className = 'close-group-' + (groupIndex++);

        group.forEach(note => {
            note.addClass(className);
        });
    });
}

//엑셀로 추가하기
document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});
//엑셀로 내보내기
document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const $outputDiv = $('#notes');
        $outputDiv.empty();

        for (let colIndex = 0; colIndex < jsonData[0].length; colIndex++) {
            for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
                const value = jsonData[rowIndex][colIndex];
                if (value === undefined) continue;

                const note = {
                    id: notes.length + 1,
                    text: `${value}`
                };
                notes.push(note);
                noteIndex++;

                const $noteElement = $('<div>')
                    .addClass('note')
                    .attr('id', 'note-' + `${noteIndex}`)
                    .text(note.text)
                    .attr('contenteditable', 'true') // 노트 수정 가능
                    .click(function(event) {
                        event.stopPropagation();
                        selectedNote = $(this);
                        $('.note').removeClass('selected');
                        $(this).addClass('selected');

                        const floatBtn2 = $('.floatBtn2');
                        floatBtn2.css({
                            display: 'flex',
                            top: event.pageY - floatBtn2.outerHeight() - 10 + 'px',
                            left: event.pageX - (floatBtn2.outerWidth() / 2) + 'px'
                        });
                    })
                    .dblclick(function() {
                        applySimilarityColors(note);
                    });
                $outputDiv.append($noteElement);
                updateFontSizeButton();

                makeNoteDraggable($noteElement);
            }
        }
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('export-btn').addEventListener('click', function() {
    var wb = XLSX.utils.book_new();

    var groupContainers = document.querySelectorAll('.group-container');

    var ws_data = [
        ["1차 헤더", "노트", "인사이트"]
    ];

    groupContainers.forEach(function(container) {
        var groupTitle = container.querySelector('.group-title').innerText;
        var notes = container.querySelectorAll('.notes .note');
        var insightNote = container.querySelector('.insight-note').innerText;

        notes.forEach(function(note, index) {
            if (index === 0) {
                ws_data.push([groupTitle, note.innerText, insightNote]);
            } else {
                ws_data.push(["", note.innerText, ""]);
            }
        });
    });
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "HTML Export");
    XLSX.writeFile(wb, "한국공학대학교 mix-lab Affinity-service.xlsx");
});

// 전역으로 사용할 수 있도록 설정
window.dragMoveListener = dragMoveListener;
