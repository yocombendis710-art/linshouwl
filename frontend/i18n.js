// 多语言字典库
const translations = {
    'zh': {
        'login_title': 'X佬工作室 - 授权登录',
        'enter_cdkey': '请输入您的授权卡密...',
        'btn_login': '安全登录',
        'current_cdkey': '当前运行卡密',
        'balance': '余量',
        'btn_import': '➕ 导入账号',
        'btn_logout': '🚪 退出',
        'total_accounts': '总账号数',
        'pending_tasks': '等待运行',
        'success_tasks': '运行成功',
        'failed_tasks': '失败 / 异常',
        'queue_title': '当前排队队列',
        'queue_desc': '当前总共有 <span id="stat-queue-count" style="color: #6366f1; font-size: 1.15rem; font-variant-numeric: tabular-nums;">0</span> 个任务正在排队等待执行',
        'tab_recent': '全部最近记录',
        'tab_pending': '等待运行',
        'tab_success': '运行成功',
        'tab_failed': '失败 / 异常',
        'btn_export': '⬇ 导出数据',
        'btn_delete': '🗑️ 删除记录',
        'btn_refresh': '🔄 手动刷新',
        'th_id': '任务ID',
        'th_email': '邮箱 (EMAIL)',
        'th_type': '任务类型',
        'th_status': '运行状态',
        'th_msg': '运行详情 (MESSAGE)',
        'th_time': '完成时间',
        'th_action': '操作',
        'empty_data': '暂无数据记录',
        'type_full': '完整订阅',
        'type_ext': '提取链接',
        'btn_retry': '🔄 重试',
        'btn_copy': '🔗 复制链接',
        'modal_import_title': '📥 批量导入账号',
        'modal_import_ph': 'example@gmail.com----pass123----recovery@gmail.com----ABCDEFG...\ntest2024@gmail.com----pwd456----XYZ123...',
        'modal_type_title': '任务类型',
        'modal_btn_cancel': '取消',
        'modal_btn_submit': '🚀 一键解析并排队'
    },
    'en': {
        'login_title': 'X Studio - Login',
        'enter_cdkey': 'Enter your CDKEY...',
        'btn_login': 'Login',
        'current_cdkey': 'Current CDKEY',
        'balance': 'Balance',
        'btn_import': '➕ Import',
        'btn_logout': '🚪 Logout',
        'total_accounts': 'Total Accounts',
        'pending_tasks': 'Pending',
        'success_tasks': 'Success',
        'failed_tasks': 'Failed / Error',
        'queue_title': 'Current Queue',
        'queue_desc': 'There are <span id="stat-queue-count" style="color: #6366f1; font-size: 1.15rem; font-variant-numeric: tabular-nums;">0</span> tasks pending in the queue.',
        'tab_recent': 'All Recent',
        'tab_pending': 'Pending',
        'tab_success': 'Success',
        'tab_failed': 'Failed / Error',
        'btn_export': '⬇ Export',
        'btn_delete': '🗑️ Delete',
        'btn_refresh': '🔄 Refresh',
        'th_id': 'Task ID',
        'th_email': 'Email',
        'th_type': 'Type',
        'th_status': 'Status',
        'th_msg': 'Message / Details',
        'th_time': 'Time',
        'th_action': 'Action',
        'empty_data': 'No data available',
        'type_full': 'Full Sub',
        'type_ext': 'Extract Link',
        'btn_retry': '🔄 Retry',
        'btn_copy': '🔗 Copy Link',
        'modal_import_title': '📥 Import Accounts',
        'modal_import_ph': 'example@gmail.com----pass123----recovery@gmail.com----2FA...\n...',
        'modal_type_title': 'Task Type',
        'modal_btn_cancel': 'Cancel',
        'modal_btn_submit': '🚀 Submit & Queue'
    },
    'vi': {
        'login_title': 'X Studio - Đăng nhập',
        'enter_cdkey': 'Nhập CDKEY của bạn...',
        'btn_login': 'Đăng nhập',
        'current_cdkey': 'CDKEY hiện tại',
        'balance': 'Số dư',
        'btn_import': '➕ Thêm tài khoản',
        'btn_logout': '🚪 Đăng xuất',
        'total_accounts': 'Tổng Tài Khoản',
        'pending_tasks': 'Đang chờ',
        'success_tasks': 'Thành công',
        'failed_tasks': 'Thất bại / Lỗi',
        'queue_title': 'Hàng đợi hiện tại',
        'queue_desc': 'Có <span id="stat-queue-count" style="color: #6366f1; font-size: 1.15rem; font-variant-numeric: tabular-nums;">0</span> nhiệm vụ đang chờ thực hiện',
        'tab_recent': 'Tất cả gần đây',
        'tab_pending': 'Đang chờ',
        'tab_success': 'Thành công',
        'tab_failed': 'Thất bại',
        'btn_export': '⬇ Xuất dữ liệu',
        'btn_delete': '🗑️ Xóa bản ghi',
        'btn_refresh': '🔄 Làm mới',
        'th_id': 'ID Nhiệm vụ',
        'th_email': 'Email',
        'th_type': 'Loại',
        'th_status': 'Trạng thái',
        'th_msg': 'Chi tiết (MESSAGE)',
        'th_time': 'Thời gian',
        'th_action': 'Thao tác',
        'empty_data': 'Không có dữ liệu',
        'type_full': 'Đăng ký đầy đủ',
        'type_ext': 'Trích xuất Link',
        'btn_retry': '🔄 Thử lại',
        'btn_copy': '🔗 Sao chép Link',
        'modal_import_title': '📥 Nhập tài khoản',
        'modal_import_ph': 'email----mậtkhẩu----emailkhôiphục----2FA...',
        'modal_type_title': 'Loại nhiệm vụ',
        'modal_btn_cancel': 'Hủy',
        'modal_btn_submit': '🚀 Gửi & Xếp hàng'
    },
    'ko': {
        'login_title': 'X 스튜디오 - 로그인',
        'enter_cdkey': 'CDKEY를 입력하세요...',
        'btn_login': '로그인',
        'current_cdkey': '현재 CDKEY',
        'balance': '잔액',
        'btn_import': '➕ 계정 가져오기',
        'btn_logout': '🚪 로그아웃',
        'total_accounts': '총 계정',
        'pending_tasks': '대기 중',
        'success_tasks': '성공',
        'failed_tasks': '실패 / 오류',
        'queue_title': '현재 대기열',
        'queue_desc': '현재 대기열에 <span id="stat-queue-count" style="color: #6366f1; font-size: 1.15rem; font-variant-numeric: tabular-nums;">0</span>개의 작업이 있습니다.',
        'tab_recent': '모든 최근 기록',
        'tab_pending': '대기 중',
        'tab_success': '성공',
        'tab_failed': '실패',
        'btn_export': '⬇ 데이터 내보내기',
        'btn_delete': '🗑️ 삭제',
        'btn_refresh': '🔄 새로고침',
        'th_id': '작업 ID',
        'th_email': '이메일',
        'th_type': '유형',
        'th_status': '상태',
        'th_msg': '메시지 / 세부 정보',
        'th_time': '시간',
        'th_action': '작업',
        'empty_data': '데이터 없음',
        'type_full': '전체 구독',
        'type_ext': '링크 추출',
        'btn_retry': '🔄 재시도',
        'btn_copy': '🔗 링크 복사',
        'modal_import_title': '📥 계정 가져오기',
        'modal_import_ph': '이메일----비밀번호----복구이메일----2FA...',
        'modal_type_title': '작업 유형',
        'modal_btn_cancel': '취소',
        'modal_btn_submit': '🚀 제출 및 대기열'
    },
    'pl': {
        'login_title': 'X Studio - Logowanie',
        'enter_cdkey': 'Wprowadź swój CDKEY...',
        'btn_login': 'Zaloguj się',
        'current_cdkey': 'Obecny CDKEY',
        'balance': 'Saldo',
        'btn_import': '➕ Importuj Konta',
        'btn_logout': '🚪 Wyloguj',
        'total_accounts': 'Suma Kont',
        'pending_tasks': 'W toku',
        'success_tasks': 'Sukces',
        'failed_tasks': 'Zakończone niepowodzeniem',
        'queue_title': 'Obecna Kolejka',
        'queue_desc': 'W kolejce oczekuje <span id="stat-queue-count" style="color: #6366f1; font-size: 1.15rem; font-variant-numeric: tabular-nums;">0</span> zadań.',
        'tab_recent': 'Wszystkie',
        'tab_pending': 'W toku',
        'tab_success': 'Sukces',
        'tab_failed': 'Niepowodzenie',
        'btn_export': '⬇ Eksport',
        'btn_delete': '🗑️ Usuń',
        'btn_refresh': '🔄 Odśwież',
        'th_id': 'ID Zadania',
        'th_email': 'Email',
        'th_type': 'Typ',
        'th_status': 'Status',
        'th_msg': 'Szczegóły',
        'th_time': 'Czas',
        'th_action': 'Akcja',
        'empty_data': 'Brak danych',
        'type_full': 'Pełna subskrypcja',
        'type_ext': 'Pobierz link',
        'btn_retry': '🔄 Ponów',
        'btn_copy': '🔗 Kopiuj',
        'modal_import_title': '📥 Importuj Konta',
        'modal_import_ph': 'email----hasło----email_zapasowy----2FA...',
        'modal_type_title': 'Typ zadania',
        'modal_btn_cancel': 'Anuluj',
        'modal_btn_submit': '🚀 Zatwierdź'
    }
};

let currentLang = localStorage.getItem('app_lang') || 'zh';

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    applyTranslations();
    
    const langSelects = document.querySelectorAll('.lang-selector');
    langSelects.forEach(select => { select.value = lang; });

    document.dispatchEvent(new Event('languageChanged'));
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerHTML = translations[currentLang][key];
            }
        }
    });
}

function t(key) {
    return translations[currentLang] && translations[currentLang][key] ? translations[currentLang][key] : key;
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const langSelects = document.querySelectorAll('.lang-selector');
    langSelects.forEach(select => { select.value = currentLang; });
});