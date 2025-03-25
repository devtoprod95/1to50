(function() {
    // DOM 요소 캐싱
    const gameGrid = document.getElementById('game-grid');
    const nextNumberElement = document.getElementById('next-number');
    const nextDotsElement = document.getElementById('next-dots');
    const timerElement = document.getElementById('timer');
    
    // 모달 요소 캐싱
    const resultModal = document.getElementById('result-modal');
    const resultTimeElement = document.getElementById('result-time');
    const nicknameInput = document.getElementById('nickname-input');
    const saveButton = document.getElementById('save-button');

    // 게임 컨트롤러 객체 - 게임 상태와 관련 기능 관리
    const GameController = {
        currentNumber: 1,            // 현재 클릭해야 할 숫자
        endNumber: 50,               // 종료 숫자
        numbers: [],                 // 숫자 배열 (1-25)
        timerInterval: null,         // 타이머 인터벌 ID
        startTime: 0,                // 게임 시작 시간
        isRunning: false,            // 게임 실행 상태
        lastActionTime: 0,           // 마지막 액션 시간
        inactivityDuration: 3000,    // 비활성 시간 임계값 (3초)
        mistakeCount: 0,             // 실수 카운트
        mistakeThreshold: 3,         // 실수 임계값
        hintCell: null,              // 현재 힌트가 표시된 셀
        hintTimer: null,             // 힌트 타이머
        finalTime: 0,                // 최종 게임 완료 시간
        
        // 게임 초기화
        init: function() {
            this.currentNumber = 1;
            this.isRunning = false;
            this.lastActionTime = Date.now();
            this.mistakeCount = 0;
            
            // 기존 타이머 제거
            this.stopTimer();
            if (this.hintTimer) {
                clearInterval(this.hintTimer);
                this.hintTimer = null;
            }
            
            timerElement.textContent = '000.00';
            
            // 그리드 정리
            this.cleanupGrid();
            
            // 새 숫자 생성
            this.numbers = this.generateRandomNumbers(1, 25);
            
            // UI 업데이트
            nextNumberElement.textContent = '1';
            nextDotsElement.textContent = '2...';
            
            // 그리드 생성
            this.createGrid();
            
            // 힌트 타이머 시작
            this.startHintTimer();
        },
        
        // 힌트 타이머 시작
        startHintTimer: function() {
            const self = this;
            
            if (this.hintTimer) {
                clearInterval(this.hintTimer);
            }
            
            // 500ms마다 비활성 상태 확인
            this.hintTimer = setInterval(function() {
                const currentTime = Date.now();
                // 게임이 실행 중이고 일정 시간 동안 액션이 없으면 힌트 표시
                if (self.isRunning && (currentTime - self.lastActionTime > self.inactivityDuration)) {
                    self.showHint();
                }
            }, 500);
        },
        
        // 힌트 표시
        showHint: function() {
            // 이미 힌트가 표시되어 있다면 중복 실행 방지
            if (this.hintCell) return;
            
            // 현재 클릭해야 할 숫자 찾기
            const cells = gameGrid.querySelectorAll('.number-cell');
            for (let i = 0; i < cells.length; i++) {
                const cellNumber = parseInt(cells[i].dataset.number);
                if (cellNumber === this.currentNumber) {
                    // 힌트 클래스 추가
                    cells[i].classList.add('hint');
                    this.hintCell = cells[i];
                    break;
                }
            }
        },
        
        // 힌트 제거
        removeHint: function() {
            if (this.hintCell) {
                this.hintCell.classList.remove('hint');
                this.hintCell = null;
            }
        },
        
        // 랜덤 숫자 생성 (Fisher-Yates 셔플 최적화)
        generateRandomNumbers: function(min, max) {
            const range = max - min + 1;
            const numbers = new Array(range);
            
            // 빠른 배열 초기화
            for (let i = 0; i < range; i++) {
                numbers[i] = min + i;
            }
            
            // Fisher-Yates 셔플 (최적화)
            for (let i = range - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                // 직접 교환 (구조분해 없이)
                const temp = numbers[i];
                numbers[i] = numbers[j];
                numbers[j] = temp;
            }
            
            return numbers;
        },
        
        // 그리드 셀 정리 (메모리 관리)
        cleanupGrid: function() {
            // 모든 이벤트 리스너 제거
            const cells = gameGrid.querySelectorAll('.number-cell');
            for (let i = 0; i < cells.length; i++) {
                cells[i].onclick = null;
            }
            gameGrid.innerHTML = '';
        },
        
        // 그리드 생성
        createGrid: function() {
            const fragment = document.createDocumentFragment();
            const self = this; // this 참조 저장
            
            for (let i = 0; i < 25; i++) {
                const cell = document.createElement('div');
                cell.className = 'number-cell';
                cell.textContent = this.numbers[i];
                cell.dataset.number = this.numbers[i];
                
                // 이벤트 핸들러에 컨텍스트 바인딩 (클로저 활용)
                cell.onclick = function(e) { 
                    self.handleCellClick(this, e);
                };
                
                fragment.appendChild(cell);
            }
            
            gameGrid.appendChild(fragment);
        },
        
        // 셀 클릭 처리
        handleCellClick: function(cell, event) {
            const clickedNumber = parseInt(cell.dataset.number);
            
            // 유효하지 않은 클릭 무시
            if (isNaN(clickedNumber) || clickedNumber < 0) {
                return;
            }
            
            // 현재 숫자 확인
            if (clickedNumber === this.currentNumber) {
                // 힌트 제거
                this.removeHint();
                
                // 첫 클릭 시 타이머 시작
                if (this.currentNumber === 1) {
                    this.startTimer();
                }
                
                // 액션 시간 업데이트
                this.lastActionTime = Date.now();
                
                // 실수 카운트 초기화
                this.mistakeCount = 0;
                
                // 클릭한 셀 표시와 애니메이션 효과
                cell.classList.add('correct');
                // 터치 피드백 애니메이션
                cell.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    cell.style.transform = 'scale(1)';
                }, 150);
                
                // 1-25 숫자 처리
                if (clickedNumber >= 1 && clickedNumber <= 25) {
                    const newNumber = clickedNumber + 25;

                    // 26-50 숫자가 이미 사용된 경우 빈 셀로 변경
                    if (newNumber < this.currentNumber + 1) {
                        this.makeEmptyCell(cell);
                    } else {
                        // 새 숫자로 교체 (애니메이션과 함께)
                        this.updateCellWithNewNumber(cell, newNumber);
                    }
                } else {
                    // 26-50 숫자는 빈 셀로 변경
                    this.makeEmptyCell(cell);
                }
                
                
                // 게임 완료 확인
                if (this.currentNumber === this.endNumber) {
                    this.gameCompleted();
                } else {
                    // 현재 숫자 증가 및 UI 업데이트
                    this.currentNumber++;
                    this.updateNextDisplay();
                }
            } else {
                // 잘못된 셀 클릭 시 처리
                this.mistakeCount++;
                
                // 실수 임계값 도달 시 힌트 표시
                if (this.mistakeCount >= this.mistakeThreshold) {
                    this.showHint();
                    this.mistakeCount = 0; // 실수 카운터 초기화
                }
                
                // 셀에 일시적인 오류 효과 주기 (shake 애니메이션)
                cell.classList.add('error');
                setTimeout(() => {
                    cell.classList.remove('error');
                }, 400);
            }
        },
        
        // 셀을 빈 셀로 만들기 (애니메이션 추가)
        makeEmptyCell: function(cell) {
            // 페이드 아웃 애니메이션
            cell.style.transition = 'all 0.3s ease-out';
            
            setTimeout(() => {
                cell.classList.add('empty');
                cell.textContent = '';
                cell.dataset.number = '-1';
                cell.onclick = null;  // 이벤트 핸들러 제거
            }, 100);
        },
        
        // 셀에 새 숫자 설정 (애니메이션 추가)
        updateCellWithNewNumber: function(cell, newNumber) {
            // 숫자 전환 애니메이션 효과
            cell.style.transform = 'scale(0.8)';
            cell.style.opacity = '0.5';
            
            setTimeout(() => {
                cell.textContent = newNumber;
                cell.dataset.number = newNumber;
                cell.classList.remove('correct');
                
                // 원래 상태로 복원 (애니메이션)
                setTimeout(() => {
                    cell.style.transform = 'scale(1)';
                    cell.style.opacity = '1';
                }, 50);
            }, 150);
        },
        
        // 다음 숫자 표시 업데이트
        updateNextDisplay: function() {
            nextNumberElement.classList.add('fade');
            
            setTimeout(() => {
                nextNumberElement.textContent = this.currentNumber;
                
                if (this.currentNumber < 50) {
                    nextDotsElement.textContent = (this.currentNumber + 1) + '...';
                } else {
                    nextDotsElement.textContent = '';
                }
                
                setTimeout(() => {
                    nextNumberElement.classList.remove('fade');
                }, 50);
            }, 50);
        },
        
        // 게임 완료 처리
        gameCompleted: function() {
            // 최종 시간 저장 - 먼저 저장하여 정확한 시간 기록
            this.finalTime = (Date.now() - this.startTime) / 1000;
            
            // 현재 화면에 표시된 시간 저장 (동기화 목적)
            const displayedTime = timerElement.textContent;
            
            // 타이머 정지
            this.stopTimer();
            
            // 힌트 타이머 정리
            if (this.hintTimer) {
                clearInterval(this.hintTimer);
                this.hintTimer = null;
            }
            
            // 셀 사라지는 애니메이션
            const cells = gameGrid.querySelectorAll('.number-cell');
            
            // 셀마다 지연시간을 다르게 해서 순차적으로 사라지는 효과
            for (let i = 0; i < cells.length; i++) {
                cells[i].onclick = null;
                
                // 랜덤한 딜레이로 셀 페이드아웃 (시각적 효과)
                const delay = Math.random() * 300;
                setTimeout(() => {
                    cells[i].classList.add('empty');
                }, delay);
            }
            
            // 모든 셀이 사라진 후 결과 모달 표시 - 화면에 표시된 시간과 동일하게 표시
            setTimeout(() => {
                this.showResultModal(displayedTime);
            }, 500);
        },
        
        // 결과 모달 표시
        showResultModal: function(displayedTime) {
            // 모달에 결과 시간 표시 (화면에 표시된 시간과 동일하게)
            if (displayedTime) {
                resultTimeElement.textContent = displayedTime;
            } else {
                resultTimeElement.textContent = this.formatTime(this.finalTime);
            }
            
            // 닉네임 입력 필드 초기화 및 포커스
            // nicknameInput.value = '';
            
            // 모달 표시 (애니메이션과 함께)
            resultModal.classList.add('active');
            
            // 입력 필드에 포커스
            setTimeout(() => {
                nicknameInput.focus();
            }, 400);
        },
        
        // 결과 모달 닫기
        closeResultModal: function() {
            resultModal.classList.remove('active');
            
            // 게임 재시작
            const self = this;
            setTimeout(() => {
                self.numbers = [];
                self.init();
            }, 300);
        },

        // 1. 다음 숫자 전환 애니메이션 업데이트 - 오른쪽에서 왼쪽으로 전환되는 효과
        updateNextDisplay: function() {
            // 변수에 새 값 저장
            const newNumber = this.currentNumber;
            const newDots = this.currentNumber < 50 ? (this.currentNumber + 1) + '...' : '';
            
            // 현재 값을 오른쪽으로 슬라이드하여 사라지게 하기
            nextNumberElement.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
            nextDotsElement.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
            
            nextNumberElement.style.transform = 'translateX(-20px)';
            nextNumberElement.style.opacity = '0';
            
            // next dots는 약간 지연시켜 연쇄적으로 이동
            setTimeout(() => {
                nextDotsElement.style.transform = 'translateX(-20px)';
                nextDotsElement.style.opacity = '0';
            }, 50);
            
            // 새 값을 준비 (화면 바깥 오른쪽에서 대기)
            setTimeout(() => {
                // 트랜지션 일시 중지
                nextNumberElement.style.transition = 'none';
                nextDotsElement.style.transition = 'none';
                
                // 새 텍스트로 업데이트
                nextNumberElement.textContent = newNumber;
                nextDotsElement.textContent = newDots;
                
                // 오른쪽에 배치
                nextNumberElement.style.transform = 'translateX(30px)';
                nextDotsElement.style.transform = 'translateX(30px)';
                
                // 강제 리플로우
                void nextNumberElement.offsetWidth;
                void nextDotsElement.offsetWidth;
                
                // 트랜지션 다시 활성화
                nextNumberElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                nextDotsElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                
                // 넘버 요소가 먼저 들어오도록
                nextNumberElement.style.transform = 'translateX(0)';
                nextNumberElement.style.opacity = '1';
                
                // 점 텍스트는 약간 지연되어 따라오도록
                setTimeout(() => {
                    nextDotsElement.style.transform = 'translateX(0)';
                    nextDotsElement.style.opacity = '1';
                }, 80);
            }, 250);
        },

        // 저장 버튼 - 빈 값 체크 및 알림 추가
        saveResult: function() {
            // 닉네임 가져오기
            const nickname = nicknameInput.value.trim();
            
            // 닉네임이 비어있는지 확인
            // if (!nickname) {
            //     // 경고 효과 적용
            //     nicknameInput.style.boxShadow = '0 0 0 2px #ff5252';
            //     nicknameInput.placeholder = '닉네임을 입력해주세요!';
                
            //     // 입력 필드 흔들림 애니메이션
            //     nicknameInput.classList.add('error');
            //     setTimeout(() => {
            //         nicknameInput.classList.remove('error');
            //     }, 400);
                
            //     // 입력 필드에 포커스
            //     nicknameInput.focus();
                
            //     return; // 저장 취소
            // }

            if (nickname) {
                // 저장 버튼 비활성화 (중복 제출 방지)
                saveButton.disabled = true;
                
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0]; // "YYYY-MM-DD" 형식으로 변환

                const payload = {
                    nickname: nickname,
                    time: timerElement.textContent,
                    date: formattedDate,
                };
                // API 엔드포인트로 결과 전송
                fetch('https://api.xn--oi2b31he2e32g.xn--3e0b707e/api/1to50/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                })
                .finally(() => {
                    // 통신 성공/실패 여부와 관계없이 모달 닫기
                    this.closeResultModal();
                    saveButton.disabled = false;
                });
            } else {
                this.closeResultModal();
            }
        },
        
        // 타이머 시작 - 부드러운 애니메이션 구현
        startTimer: function() {
            this.isRunning = true;
            this.startTime = Date.now();
            this.lastActionTime = Date.now();
            
            // 기존 타이머 정리
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            const self = this;
            
            // requestAnimationFrame 사용으로 더 부드러운 업데이트
            let lastTimerUpdate = 0;
            const updateFrequency = 60; // ms (약 16.7ms = 60fps)
            
            const updateTimer = function(timestamp) {
                if (!self.isRunning) return;
                
                // 업데이트 빈도 제한 (DOM 변경 최소화)
                if (timestamp - lastTimerUpdate > updateFrequency) {
                    const elapsedTime = (Date.now() - self.startTime) / 1000;
                    
                    // 엘리먼트 업데이트 최적화
                    const formattedTime = self.formatTime(elapsedTime);
                    if (timerElement.textContent !== formattedTime) {
                        timerElement.textContent = formattedTime;
                    }
                    
                    lastTimerUpdate = timestamp;
                }
                
                requestAnimationFrame(updateTimer);
            };
            
            requestAnimationFrame(updateTimer);
        },
        
        // 타이머 정지
        stopTimer: function() {
            this.isRunning = false;
            
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },
        
        // 시간 포맷팅 (000.00 형식) - 최적화
        formatTime: function(time) {
            const seconds = Math.floor(time);
            // 소수점 이하가 깜빡이는 것을 줄이기 위해 반올림
            const hundredths = Math.floor((time - seconds) * 100);
            
            // 문자열 연산 최소화 (문자열 생성 줄임)
            const s = seconds < 100 ? (seconds < 10 ? '00' + seconds : '0' + seconds) : seconds.toString();
            const h = hundredths < 10 ? '0' + hundredths : hundredths.toString();
            
            return s + '.' + h;
        }
    };

    // 이벤트 핸들러 설정
    function setupEventListeners() {
        // 더블 탭 확대 방지
        document.addEventListener('dblclick', function(e) {
            e.preventDefault();
        });
        
        // 전체 문서에 클릭 이벤트 리스너 추가
        document.addEventListener('click', function(e) {
            // 숫자 셀 외부를 클릭한 경우에도 실수로 간주
            if (!e.target.classList.contains('number-cell') && GameController.isRunning) {
                GameController.mistakeCount++;
                
                // 실수 임계값 도달 시 힌트 표시
                if (GameController.mistakeCount >= GameController.mistakeThreshold) {
                    GameController.showHint();
                    GameController.mistakeCount = 0;
                }
            }
        });
        
        // 저장 버튼 클릭 이벤트
        saveButton.addEventListener('click', function() {
            GameController.saveResult();
        });
        
        // 엔터 키로 저장
        nicknameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                GameController.saveResult();
            }
        });
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        GameController.init();
    });
})();