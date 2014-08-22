/*
 //! version : 4.0.0-beta
 =========================================================
 bootstrap-datetimejs
 https://github.com/Eonasdan/bootstrap-datetimepicker
 =========================================================
 The MIT License (MIT)

 Copyright (c) 2014 Jonathan Peterson

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD is used - Register as an anonymous module.
        define(['jquery', 'moment'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'), require('moment'));
    } else {
        // Neither AMD nor CommonJS used. Use global variables.
        if (!jQuery) {
            throw 'bootstrap-datetimepicker requires jQuery to be loaded first';
        }
        if (!moment) {
            throw 'bootstrap-datetimepicker requires Moment.js to be loaded first';
        }
        factory(jQuery, moment);
    }
}(function ($, moment) {
    'use strict';
    if (!moment) {
        throw new Error('bootstrap-datetimepicker requires Moment.js to be loaded first');
    }

    var dateTimePicker = function (element, options) {
            var picker = {},
                date = moment(),
                viewDate = date.clone(),
                unset = true,
                input,
                component = false,
                widget = false,
                use24hours,
                minViewModeNumber = 0,
                format,
                errored = false,
                currentViewMode,
                datePickerModes = [
                    {
                        clsName: 'days',
                        navFnc: 'M',
                        navStep: 1
                    },
                    {
                        clsName: 'months',
                        navFnc: 'y',
                        navStep: 1
                    },
                    {
                        clsName: 'years',
                        navFnc: 'y',
                        navStep: 10
                    }
                ],
                viewModes = ['days', 'months', 'years'],
                directionModes = ['top', 'bottom', 'auto'],
                orientationModes = ['left', 'right'],

                /********************************************************************************
                 *
                 * Private functions
                 *
                 ********************************************************************************/
                isEnabled = function (granularity) {
                    if (typeof granularity !== 'string' || granularity.length > 1) {
                        throw new TypeError('isEnabled expects a single character string parameter');
                    }
                    switch (granularity) {
                    case 'y':
                        return format.indexOf('Y') !== -1;
                    case 'M':
                        return format.indexOf('M') !== -1;
                    case 'd':
                        return format.toLowerCase().indexOf('d') !== -1;
                    case 'h':
                    case 'H':
                        return format.toLowerCase().indexOf('h') !== -1;
                    case 'm':
                        return format.indexOf('m') !== -1;
                    case 's':
                        return format.indexOf('s') !== -1;
                    default:
                        return false;
                    }
                },

                hasTime = function () {
                    return (isEnabled('h') || isEnabled('m') || isEnabled('s'));
                },

                hasDate = function () {
                    return (isEnabled('y') || isEnabled('M') || isEnabled('d'));
                },

                getDatePickerTemplate = function () {
                    var headTemplate = $('<thead>')
                            .append($('<tr>')
                                .append($('<th>').addClass('prev').attr('data-action', 'previous')
                                    .append($('<span>').addClass(options.icons.previous))
                                    )
                                .append($('<th>').addClass('picker-switch').attr('data-action', 'pickerSwitch').attr('colspan', (options.calendarWeeks ? '6' : '5')))
                                .append($('<th>').addClass('next').attr('data-action', 'next')
                                    .append($('<span>').addClass(options.icons.next))
                                    )
                                ),
                        contTemplate = $('<tbody>')
                            .append($('<tr>')
                                .append($('<td>').attr('colspan', (options.calendarWeeks ? '8' : '7')))
                                );

                    return [
                        $('<div>').addClass('datepicker-days')
                            .append($('<table>').addClass('table-condensed')
                                .append(headTemplate)
                                .append($('<tbody>'))
                                ),
                        $('<div>').addClass('datepicker-months')
                            .append($('<table>').addClass('table-condensed')
                                .append(headTemplate.clone())
                                .append(contTemplate.clone())
                                ),
                        $('<div>').addClass('datepicker-years')
                            .append($('<table>').addClass('table-condensed')
                                .append(headTemplate.clone())
                                .append(contTemplate.clone())
                                )
                    ];
                },

                getTimePickerMainTemplate = function () {
                    var topRow = $('<tr>'),
                        middleRow = $('<tr>'),
                        bottomRow = $('<tr>');

                    if (isEnabled('h')) {
                        topRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'incrementHours')
                                .append($('<span>').addClass(options.icons.up))));
                        middleRow.append($('<td>')
                            .append($('<span>').addClass('timepicker-hour').attr('data-time-component', 'hours').attr('data-action', 'showHours')));
                        bottomRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'decrementHours')
                                .append($('<span>').addClass(options.icons.down))));
                    }
                    if (isEnabled('m')) {
                        if (isEnabled('h')) {
                            topRow.append($('<td>').addClass('separator'));
                            middleRow.append($('<td>').addClass('separator').html(':'));
                            bottomRow.append($('<td>').addClass('separator'));
                        }
                        topRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'incrementMinutes')
                                .append($('<span>').addClass(options.icons.up))));
                        middleRow.append($('<td>')
                            .append($('<span>').addClass('timepicker-minute').attr('data-time-component', 'minutes').attr('data-action', 'showMinutes')));
                        bottomRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'decrementMinutes')
                                .append($('<span>').addClass(options.icons.down))));
                    }
                    if (isEnabled('s')) {
                        if (isEnabled('m')) {
                            topRow.append($('<td>').addClass('separator'));
                            middleRow.append($('<td>').addClass('separator').html(':'));
                            bottomRow.append($('<td>').addClass('separator'));
                        }
                        topRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'incrementSeconds')
                                .append($('<span>').addClass(options.icons.up))));
                        middleRow.append($('<td>')
                            .append($('<span>').addClass('timepicker-second').attr('data-time-component', 'seconds').attr('data-action', 'showSeconds')));
                        bottomRow.append($('<td>')
                            .append($('<a>').attr('href', '#').addClass('btn').attr('data-action', 'decrementSeconds')
                                .append($('<span>').addClass(options.icons.down))));
                    }

                    if (!use24hours) {
                        topRow.append($('<td>').addClass('separator'));
                        middleRow.append($('<td>')
                            .append($('<button>').addClass('btn btn-primary').attr('data-action', 'togglePeriod')));
                        bottomRow.append($('<td>').addClass('separator'));
                    }

                    return $('<div>').addClass('timepicker-picker')
                        .append($('<table>').addClass('table-condensed')
                            .append([topRow, middleRow, bottomRow]));
                },

                getTimePickerTemplate = function () {
                    var hoursView = $('<div>').addClass('timepicker-hours')
                            .append($('<table>').addClass('table-condensed')),
                        minutesView = $('<div>').addClass('timepicker-minutes')
                            .append($('<table>').addClass('table-condensed')),
                        secondsView = $('<div>').addClass('timepicker-seconds')
                            .append($('<table>').addClass('table-condensed')),
                        ret = [getTimePickerMainTemplate()];


                    if (isEnabled('h')) {
                        ret.push(hoursView);
                    }
                    if (isEnabled('m')) {
                        ret.push(minutesView);
                    }
                    if (isEnabled('s')) {
                        ret.push(secondsView);
                    }

                    return ret;
                },

                getToolbar = function () {
                    var row = [];
                    if (options.showTodayButton) {
                        row.push($('<td>').append($('<a>').attr('data-action', 'today').append($('<span>').addClass(options.icons.today))));
                    }
                    if (hasDate() && hasTime()) {
                        row.push($('<td>').append($('<a>').attr('data-action', 'togglePicker').append($('<span>').addClass(options.icons.time))));
                    }
                    if (options.showClear) {
                        row.push($('<td>').append($('<a>').attr('data-action', 'clear').append($('<span>').addClass(options.icons.clear))));
                    }
                    return $('<table>').addClass('table-condensed').append($('<tbody>').append($('<tr>').append(row)));
                },

                getTemplate = function () {
                    var template = $('<div>').addClass('bootstrap-datetimepicker-widget dropdown-menu'),
                        dateView = $('<div>').addClass('datepicker').append(getDatePickerTemplate()),
                        timeView = $('<div>').addClass('timepicker').append(getTimePickerTemplate()),
                        content = $('<ul>').addClass('list-unstyled');

                    if (options.sideBySide && hasDate() && hasTime()) {
                        template.addClass('timepicker-sbs');
                        if (use24hours) {
                            template.addClass('usetwentyfour');
                        }
                        template.append(
                            $('<div>').addClass('row')
                                .append(dateView.addClass('col-sm-6'))
                                .append(timeView.addClass('col-sm-6'))
                        );
                        return template;
                    }

                    if (hasDate()) {
                        content.append($('<li>').addClass((options.collapse && hasTime() ? 'collapse in' : '')).append(dateView));
                    }
                    content.append($('<li>').addClass('picker-switch' + (options.collapse ? ' accordion-toggle' : '')).append(getToolbar()));
                    if (hasTime()) {
                        content.append($('<li>').addClass((options.collapse && hasDate() ? 'collapse' : '')).append(timeView));
                    }
                    return template.append(content);
                },

                dataToOptions = function () {
                    var eData = input.data(), dataOptions = {};

                    if (eData.dateOptions && eData.dateOptions instanceof Object) {
                        dataOptions = $.extend(true, dataOptions, eData.dateOptions);
                    }

                    $.each(options, function (key) {
                        var attributeName = 'date' + key.charAt(0).toUpperCase() + key.slice(1);
                        if (eData[attributeName] !== undefined) {
                            dataOptions[key] = eData[attributeName];
                        }
                    });
                    return dataOptions;
                },

                isInFixed = function () {
                    var inFixed = false;
                    if (element) {
                        $.each(element.parents(), function () {
                            if ($(this).css('position') === 'fixed') {
                                inFixed = true;
                            }
                        });
                    }
                    return inFixed;
                },

                place = function () {
                    var position = 'absolute',
                        offset = component ? component.offset() : element.offset(),
                        $window = $(window),
                        placePosition,
                        width;

                    if (!widget) {
                        return;
                    }

                    width = component ? component.outerWidth() : element.outerWidth();
                    offset.top = offset.top + element.outerHeight();

                    placePosition = options.direction;
                    if (placePosition === 'auto') {
                        if (offset.top + widget.height() > $window.height() + $window.scrollTop() && widget.height() + element.outerHeight() < offset.top) {
                            placePosition = 'top';
                        } else {
                            placePosition = 'bottom';
                        }
                    }
                    if (placePosition === 'top') {
                        offset.bottom = $window.height() - offset.top + element.outerHeight() + 3;
                        widget.addClass('top').removeClass('bottom');
                    } else {
                        offset.top += 1;
                        widget.addClass('bottom').removeClass('top');
                    }

                    if (options.orientation === 'left') {
                        widget.addClass('left-oriented');
                        offset.left = offset.left - widget.width() + 20;
                    }

                    if (isInFixed()) {
                        position = 'fixed';
                        offset.top -= $window.scrollTop();
                        offset.left -= $window.scrollLeft();
                    }

                    if ($window.width() < offset.left + widget.outerWidth()) {
                        offset.right = $window.width() - offset.left - width;
                        offset.left = 'auto';
                        widget.addClass('pull-right');
                    } else {
                        offset.right = 'auto';
                        widget.removeClass('pull-right');
                    }

                    if (placePosition === 'top') {
                        widget.css({
                            position: position,
                            bottom: offset.bottom,
                            top: 'auto',
                            left: offset.left,
                            right: offset.right
                        });
                    } else {
                        widget.css({
                            position: position,
                            top: offset.top,
                            bottom: 'auto',
                            left: offset.left,
                            right: offset.right
                        });
                    }
                },

                notifyEvent = function (e) {
                    if (e.type === 'dp.change' && e.date && e.date.isSame(e.oldDate) && !errored && !unset) {
                        return;
                    }
                    element.trigger(e);
                },

                showMode = function (dir) {
                    if (!widget) {
                        return;
                    }
                    if (dir) {
                        currentViewMode = Math.max(minViewModeNumber, Math.min(2, currentViewMode + dir));
                    }
                    widget.find('.datepicker > div').hide().filter('.datepicker-' + datePickerModes[currentViewMode].clsName).show();
                    place();
                },

                fillDow = function () {
                    var row = $('<tr>'),
                        currentDate = viewDate.clone().startOf('w');

                    if (options.calendarWeeks === true) {
                        row.append($('<th>').addClass('cw').text('#'));
                    }

                    while (currentDate.isBefore(viewDate.clone().endOf('w'))) {
                        row.append($('<th>').addClass('dow').text(currentDate.format('dd')));
                        currentDate.add(1, 'd');
                    }
                    widget.find('.datepicker-days thead').append(row);
                },

                isInDisabledDates = function (date) {
                    if (!options.disabledDates) {
                        return false;
                    }
                    return options.disabledDates[date.format('YYYY-MM-DD')] === true;
                },

                isInEnabledDates = function (date) {
                    if (!options.enabledDates) {
                        return false;
                    }
                    return options.enabledDates[date.format('YYYY-MM-DD')] === true;
                },

                isValid = function (targetMoment, granularity) {
                    if (!targetMoment.isValid()) {
                        return false;
                    }
                    if (options.disabledDates && isInDisabledDates(targetMoment)) {
                        return false;
                    }
                    if (options.enabledDates && isInEnabledDates(targetMoment)) {
                        return true;
                    }
                    if (options.minDate && targetMoment.isBefore(options.minDate, granularity)) {
                        return false;
                    }
                    if (options.maxDate && targetMoment.isAfter(options.maxDate, granularity)) {
                        return false;
                    }
                    if (options.daysOfWeekDisabled.indexOf(targetMoment.day()) !== -1) {
                        return false;
                    }
                    return true;
                },

                fillMonths = function () {
                    var spans = [],
                        monthsShort = viewDate.clone().startOf('y').hour(12); // hour is changed to avoid DST issues in some browsers
                    while (monthsShort.isSame(viewDate, 'y')) {
                        spans.push($('<span>').attr('data-action', 'selectMonth').addClass('month').text(monthsShort.format('MMM')));
                        monthsShort.add(1, 'M');
                    }
                    widget.find('.datepicker-months td').empty().append(spans);
                },

                updateMonths = function () {
                    var monthsView = widget.find('.datepicker-months'),
                        monthsViewHeader = monthsView.find('th'),
                        months = monthsView.find('tbody').find('span');

                    monthsView.find('.disabled').removeClass('disabled');

                    if (!isValid(viewDate.clone().subtract(1, 'y'), 'y')) {
                        monthsViewHeader.eq(0).addClass('disabled');
                    }

                    monthsViewHeader.eq(1).text(viewDate.year());

                    if (!isValid(viewDate.clone().add(1, 'y'), 'y')) {
                        monthsViewHeader.eq(2).addClass('disabled');
                    }

                    months.removeClass('active');
                    if (date.isSame(viewDate, 'y')) {
                        months.eq(date.month()).addClass('active');
                    }

                    months.each(function (index) {
                        if (!isValid(viewDate.clone().month(index), 'M')) {
                            $(this).addClass('disabled');
                        }
                    });
                },

                updateYears = function () {
                    var yearsView = widget.find('.datepicker-years'),
                        yearsViewHeader = yearsView.find('th'),
                        startYear = viewDate.clone().subtract(5, 'y'),
                        endYear = viewDate.clone().add(6, 'y'),
                        html = '';

                    yearsView.find('.disabled').removeClass('disabled');

                    if (options.minDate && options.minDate.isAfter(startYear, 'y')) {
                        yearsViewHeader.eq(0).addClass('disabled');
                    }

                    yearsViewHeader.eq(1).text(startYear.year() + '-' + endYear.year());

                    if (options.maxDate && options.maxDate.isBefore(endYear, 'y')) {
                        yearsViewHeader.eq(2).addClass('disabled');
                    }

                    while (!startYear.isAfter(endYear, 'y')) {
                        html += '<span data-action="selectYear" class="year' + (startYear.isSame(date, 'y') ? ' active' : '') + (!isValid(startYear, 'y') ? ' disabled' : '') + '">' + startYear.year() + '</span>';
                        startYear.add(1, 'y');
                    }

                    yearsView.find('td').html(html);
                },

                fillDate = function () {
                    var daysView = widget.find('.datepicker-days'),
                        daysViewHeader = daysView.find('th'),
                        currentDate,
                        html = [],
                        row,
                        clsName;

                    if (!hasDate()) {
                        return;
                    }

                    daysView.find('.disabled').removeClass('disabled');

                    daysViewHeader.eq(1).text(viewDate.format('MMMM YYYY'));

                    if (!isValid(viewDate.clone().subtract(1, 'M'), 'M')) {
                        daysViewHeader.eq(0).addClass('disabled');
                    }
                    if (!isValid(viewDate.clone().add(1, 'M'), 'M')) {
                        daysViewHeader.eq(2).addClass('disabled');
                    }

                    currentDate = viewDate.clone().startOf('M').startOf('week');

                    while (!viewDate.clone().endOf('M').endOf('w').isBefore(currentDate, 'd')) {
                        if (currentDate.weekday() === 0) {
                            row = $('<tr>');
                            if (options.calendarWeeks) {
                                row.append('<td class="cw">' + currentDate.week() + '</td>');
                            }
                            html.push(row);
                        }
                        clsName = '';
                        if (currentDate.isBefore(viewDate, 'M')) {
                            clsName += ' old';
                        }
                        if (currentDate.isAfter(viewDate, 'M')) {
                            clsName += ' new';
                        }
                        if (currentDate.isSame(date, 'd') && !unset) {
                            clsName += ' active';
                        }
                        if (!isValid(currentDate, 'd')) {
                            clsName += ' disabled';
                        }
                        if (currentDate.isSame(moment(), 'd')) {
                            clsName += ' today';
                        }
                        row.append('<td data-action="selectDay" class="day' + clsName + '">' + currentDate.date() + '</td>');
                        currentDate.add(1, 'd');
                    }

                    daysView.find('tbody').empty().append(html);

                    updateMonths();

                    updateYears();
                },

                fillHours = function () {
                    var table = widget.find('.timepicker-hours table'),
                        currentHour = viewDate.clone().startOf('d'),
                        html = [],
                        row;

                    if (viewDate.hour() > 11 && !use24hours) {
                        currentHour.hour(12);
                    }
                    while (currentHour.isSame(viewDate, 'd') && (use24hours || (viewDate.hour() < 12 && currentHour.hour() < 12) || viewDate.hour() > 11)) {
                        if (currentHour.hour() % 4 === 0) {
                            row = $('<tr>');
                            html.push(row);
                        }
                        row.append('<td data-action="selectHour" class="hour' + (!isValid(currentHour, 'h') ? ' disabled' : '') + '">' + currentHour.format(use24hours ? 'HH' : 'hh') + '</td>');
                        currentHour.add(1, 'h');
                    }
                    table.empty().append(html);
                },

                fillMinutes = function () {
                    var table = widget.find('.timepicker-minutes table'),
                        currentMinute = viewDate.clone().startOf('h'),
                        html = [],
                        row,
                        step = options.stepping === 1 ? 5 : options.stepping;

                    while (viewDate.isSame(currentMinute, 'h')) {
                        if (currentMinute.minute() % (step * 4) === 0) {
                            row = $('<tr>');
                            html.push(row);
                        }
                        row.append('<td data-action="selectMinute" class="minute' + (!isValid(currentMinute, 'm') ? ' disabled' : '') + '">' + currentMinute.format('mm') + '</td>');
                        currentMinute.add(step, 'm');
                    }
                    table.empty().append(html);
                },

                fillSeconds = function () {
                    var table = widget.find('.timepicker-seconds table'),
                        currentSecond = viewDate.clone().startOf('m'),
                        html = [],
                        row;

                    while (viewDate.isSame(currentSecond, 'm')) {
                        if (currentSecond.second() % 20 === 0) {
                            row = $('<tr>');
                            html.push(row);
                        }
                        row.append('<td data-action="selectSecond" class="second' + (!isValid(currentSecond, 's') ? ' disabled' : '') + '">' + currentSecond.format('ss') + '</td>');
                        currentSecond.add(5, 's');
                    }

                    table.empty().append(html);
                },

                fillTime = function () {
                    var timeComponents = widget.find('.timepicker span[data-time-component]');
                    if (!use24hours) {
                        widget.find('.timepicker [data-action=togglePeriod]').text(date.format('A'));
                    }
                    timeComponents.filter('[data-time-component=hours]').text(date.format(use24hours ? 'HH' : 'hh'));
                    timeComponents.filter('[data-time-component=minutes]').text(date.format('mm'));
                    timeComponents.filter('[data-time-component=seconds]').text(date.format('ss'));

                    fillHours();
                    fillMinutes();
                    fillSeconds();
                },

                update = function () {
                    if (!widget) {
                        return;
                    }
                    fillDate();
                    fillTime();
                    place();
                },

                setValue = function (targetMoment) {
                    var oldDate = date;

                    // case of calling setValue(null or false)
                    if (!targetMoment) {
                        unset = true;
                        input.val('');
                        element.data('date', '');
                        notifyEvent({
                            type: 'dp.change',
                            date: null,
                            oldDate: oldDate
                        });
                        update();
                        return;
                    }

                    targetMoment = targetMoment.clone().locale(options.locale);

                    if (options.stepping !== 1) {
                        targetMoment.minutes((Math.round(targetMoment.minutes() / options.stepping) * options.stepping) % 60).seconds(0);
                    }

                    if (isValid(targetMoment)) {
                        date = targetMoment;
                        viewDate = date.clone();
                        input.val(date.format(format));
                        element.data('date', date.format(format));
                        update();
                        notifyEvent({
                            type: 'dp.change',
                            date: picker.date(),
                            oldDate: oldDate
                        });
                        errored = false;
                        unset = false;
                    } else {
                        errored = true;
                        notifyEvent({
                            type: 'dp.error',
                            date: targetMoment
                        });
                    }
                },

                stopEvent = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                },

                parseInputDate = function (date) {
                    if (moment.isMoment(date) || date instanceof Date) {
                        date = moment(date);
                    } else {
                        date = moment(date, format, options.useStrict);
                    }
                    date.locale(options.locale);
                    return date;
                },

                keydown = function (e) {
                    if (e.keyCode === 27) { // allow escape to hide picker
                        picker.hide();
                    }
                },

                change = function (e) {
                    picker.date($(e.target).val());
                },

                attachDatePickerElementEvents = function () {
                    if (element.is('input')) {
                        element.on({
                            'click': picker.show,
                            'focus': picker.show,
                            'change': change,
                            'blur': picker.hide,
                            'keydown': keydown
                        });
                    } else {
                        element.on({
                            'change': change
                        }, 'input');
                        if (component) {
                            component.on('click', picker.toggle);
                            component.on('mousedown', stopEvent);
                        } else {
                            element.on('click', picker.show);
                        }
                    }
                },

                detachDatePickerElementEvents = function () {
                    if (element.is('input')) {
                        element.off({
                            'focus': picker.show,
                            'change': change,
                            'blur': picker.hide,
                            'click': picker.show,
                            'keydown': keydown
                        });
                    } else {
                        element.off({
                            'change': change
                        }, 'input');
                        if (component) {
                            component.off('click', picker.toggle);
                            component.off('mousedown', stopEvent);
                        } else {
                            element.off('click', picker.show);
                        }
                    }
                },

                indexGivenDates = function (givenDatesArray) {
                    // Store given enabledDates and disabledDates as keys.
                    // This way we can check their existence in O(1) time instead of looping through whole array.
                    // (for example: options.enabledDates['2014-02-27'] === true)
                    var givenDatesIndexed = {};
                    $.each(givenDatesArray, function () {
                        var dDate = parseInputDate(this);
                        if (dDate.isValid()) {
                            givenDatesIndexed[dDate.format('YYYY-MM-DD')] = true;
                        }
                    });
                    return (Object.keys(givenDatesIndexed).length) ? givenDatesIndexed : false;
                },

                /********************************************************************************
                 *
                 * Widget UI interaction functions
                 *
                 ********************************************************************************/
                actions = {
                    next: function () {
                        viewDate.add(datePickerModes[currentViewMode].navStep, datePickerModes[currentViewMode].navFnc);
                        fillDate();
                    },

                    previous: function () {
                        viewDate.subtract(datePickerModes[currentViewMode].navStep, datePickerModes[currentViewMode].navFnc);
                        fillDate();
                    },

                    pickerSwitch: function () {
                        showMode(1);
                    },

                    selectMonth: function (e) {
                        var month = $(e.target).closest('tbody').find('span').index($(e.target));
                        viewDate.month(month);
                        if (currentViewMode === minViewModeNumber) {
                            setValue(date.clone().year(viewDate.year()).month(viewDate.month()));
                            picker.hide();
                        }
                        showMode(-1);
                        fillDate();
                    },

                    selectYear: function (e) {
                        var year = parseInt($(e.target).text(), 10) || 0;
                        viewDate.year(year);
                        if (currentViewMode === minViewModeNumber) {
                            setValue(date.clone().year(viewDate.year()));
                            picker.hide();
                        }
                        showMode(-1);
                        fillDate();
                    },

                    selectDay: function (e) {
                        var day = viewDate.clone();
                        if ($(e.target).is('.old')) {
                            day.subtract(1, 'M');
                        }
                        if ($(e.target).is('.new')) {
                            day.add(1, 'M');
                        }
                        setValue(day.date(parseInt($(e.target).text(), 10)));
                        if (!hasTime()) {
                            picker.hide();
                        }
                    },

                    incrementHours: function () {
                        setValue(date.clone().add(1, 'h'));
                    },

                    incrementMinutes: function () {
                        setValue(date.clone().add(options.stepping, 'm'));
                    },

                    incrementSeconds: function () {
                        setValue(date.clone().add(1, 's'));
                    },

                    decrementHours: function () {
                        setValue(date.clone().subtract(1, 'h'));
                    },

                    decrementMinutes: function () {
                        setValue(date.clone().subtract(options.stepping, 'm'));
                    },

                    decrementSeconds: function () {
                        setValue(date.clone().subtract(1, 's'));
                    },

                    togglePeriod: function () {
                        setValue(date.clone().add((picker.date().hours() >= 12) ? -12 : 12, 'h'));
                    },

                    togglePicker: function (e) {
                        var $this = $(e.target),
                            $parent = $this.closest('ul'),
                            expanded = $parent.find('.in'),
                            closed = $parent.find('.collapse:not(.in)'),
                            collapseData;

                        if (expanded && expanded.length) {
                            collapseData = expanded.data('collapse');
                            if (collapseData && collapseData.transitioning) {
                                return;
                            }
                            expanded.collapse('hide');
                            closed.collapse('show');
                            if ($this.is('span')) {
                                $this.toggleClass(options.icons.time + ' ' + options.icons.date);
                            } else {
                                $this.find('span').toggleClass(options.icons.time + ' ' + options.icons.date);
                            }
                            if (component) {
                                component.find('span').toggleClass(options.icons.time + ' ' + options.icons.date);
                            }
                        }
                    },

                    showPicker: function () {
                        widget.find('.timepicker > div:not(.timepicker-picker)').hide();
                        widget.find('.timepicker .timepicker-picker').show();
                    },

                    showHours: function () {
                        widget.find('.timepicker .timepicker-picker').hide();
                        widget.find('.timepicker .timepicker-hours').show();
                    },

                    showMinutes: function () {
                        widget.find('.timepicker .timepicker-picker').hide();
                        widget.find('.timepicker .timepicker-minutes').show();
                    },

                    showSeconds: function () {
                        widget.find('.timepicker .timepicker-picker').hide();
                        widget.find('.timepicker .timepicker-seconds').show();
                    },

                    selectHour: function (e) {
                        var hour = parseInt($(e.target).text(), 10);

                        if (!use24hours) {
                            if (date.hours() >= 12) {
                                if (hour !== 12) {
                                    hour += 12;
                                }
                            } else {
                                if (hour === 12) {
                                    hour = 0;
                                }
                            }
                        }
                        setValue(date.clone().hours(hour));
                        actions.showPicker.call(picker);
                    },

                    selectMinute: function (e) {
                        setValue(date.clone().minutes(parseInt($(e.target).text(), 10)));
                        actions.showPicker.call(picker);
                    },

                    selectSecond: function (e) {
                        setValue(date.clone().seconds(parseInt($(e.target).text(), 10)));
                        actions.showPicker.call(picker);
                    },

                    clear: function () {
                        picker.date(null);
                    },

                    today: function () {
                        picker.date(moment());
                    }
                },

                doAction = function (e) {
                    stopEvent(e);
                    if ($(e.currentTarget).is('.disabled')) {
                        return;
                    }
                    return actions[$(e.currentTarget).data('action')].apply(picker, arguments);
                },

                attachDatePickerWidgetEvents = function () {
                    $(window).on('resize', place);
                    widget.on('click', '[data-action]', doAction); // this handles clicks on the widget
                    widget.on('mousedown', stopEvent);
                    if (!element.is('input')) {
                        $(document).on('mousedown', picker.hide);
                    }
                },

                detachDatePickerWidgetEvents = function () {
                    $(window).off('resize', place);
                    widget.off('click', '[data-action]');
                    widget.off('mousedown', stopEvent);
                    if (!element.is('input')) {
                        $(document).off('mousedown', picker.hide);
                    }
                },

                createWidget = function () {
                    if (widget) {
                        return;
                    }
                    options.widgetParent =
                        (typeof options.widgetParent === 'string' && options.widgetParent) ||
                        element.parents().filter(function () {
                            return 'scroll' === $(this).css('overflow-y');
                        }).get(0) ||
                        'body';

                    widget = $(getTemplate()).appendTo(options.widgetParent);

                    fillDow();
                    fillMonths();

                    widget.find('.timepicker-hours').hide();
                    widget.find('.timepicker-minutes').hide();
                    widget.find('.timepicker-seconds').hide();

                    update();
                    showMode();
                    attachDatePickerWidgetEvents();
                },

                destroyWidget = function () {
                    if (!widget) {
                        return;
                    }
                    detachDatePickerWidgetEvents();
                    widget.remove();
                    widget = false;
                };

            /********************************************************************************
             *
             * Public API functions
             * =====================
             *
             * Important: Do not expose direct references of private objects or the options
             * object to the outer world. Always return a clone when returning values or make
             * a clone when setting a private variable.
             *
             ********************************************************************************/
            picker.destroy = function () {
                picker.hide();
                detachDatePickerElementEvents();
                element.removeData('DateTimePicker');
                element.removeData('date');
            };

            picker.toggle = function () {
                return (widget ? picker.hide() : picker.show());
            };

            picker.show = function () {
                var currentMoment;
                if (input.prop('disabled') || input.prop('readonly') || widget) {
                    return picker;
                }
                if (options.useCurrent && unset) {
                    currentMoment = moment();
                    if (typeof options.useCurrent === 'string') {
                        switch (options.useCurrent) {
                        case 'year':
                            currentMoment.month(0).date(1).hours(0).seconds(0).minutes(0);
                            break;
                        case 'month':
                            currentMoment.date(1).hours(0).seconds(0).minutes(0);
                            break;
                        case 'day':
                            currentMoment.hours(0).seconds(0).minutes(0);
                            break;
                        case 'hour':
                            currentMoment.seconds(0).minutes(0);
                            break;
                        case 'minute':
                            currentMoment.seconds(0);
                            break;
                        }
                    }
                    setValue(currentMoment);
                }
                createWidget();
                if (component && component.hasClass('btn')) {
                    component.toggleClass('active');
                }
                widget.show();
                place();
                notifyEvent({
                    type: 'dp.show',
                    date: picker.date()
                });
                return picker;
            };

            picker.hide = function () {
                var transitioning = false;
                if (!widget) {
                    return picker;
                }
                // Ignore event if in the middle of a picker transition
                widget.find('.collapse').each(function () {
                    var collapseData = $(this).data('collapse');
                    if (collapseData && collapseData.transitioning) {
                        transitioning = true;
                        return false;
                    }
                });
                if (transitioning) {
                    return picker;
                }
                if (component && component.hasClass('btn')) {
                    component.toggleClass('active');
                }
                widget.hide();
                destroyWidget();
                notifyEvent({
                    type: 'dp.hide',
                    date: picker.date()
                });
                return picker;
            };

            picker.disable = function () {
                picker.hide();
                if (component && component.hasClass('btn')) {
                    component.addClass('disabled');
                }
                input.prop('disabled', true);
                return picker;
            };

            picker.enable = function () {
                if (component && component.hasClass('btn')) {
                    component.removeClass('disabled');
                }
                input.prop('disabled', false);
                return picker;
            };

            picker.options = function (newOptions) {
                if (arguments.length === 0) {
                    return $.extend(true, {}, options);
                }

                if (!(newOptions instanceof Object)) {
                    throw new TypeError('options() options parameter should be an object');
                }
                $.extend(true, options, newOptions);
                $.each(options, function (key, value) {
                    if (picker[key] !== undefined) {
                        picker[key](value);
                    } else {
                        throw new TypeError('option ' + key + ' is not recognized!');
                    }
                });
                return picker;
            };

            picker.date = function (newDate) {
                if (arguments.length === 0) {
                    if (unset) {
                        return null;
                    }
                    return date.clone();
                }

                if (newDate !== null && typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
                    throw new TypeError('date() parameter must be one of [null, string, moment or Date]');
                }

                setValue(newDate === null ? null : parseInputDate(newDate));
                return picker;
            };

            picker.format = function (newFormat) {
                if (arguments.length === 0) {
                    return options.format;
                }

                if ((typeof newFormat !== 'string') && ((typeof newFormat !== 'boolean') || (newFormat !== false))) {
                    throw new TypeError('format() expects a sting or boolean:false variable ' + newFormat);
                }

                options.format = newFormat;

                if (!newFormat) {
                    newFormat = date.localeData().longDateFormat('L') + ' ' + date.localeData().longDateFormat('LT');
                }

                format = newFormat;
                use24hours = (format.toLowerCase().indexOf('a') < 1 && format.indexOf('h') < 1);

                if (isEnabled('y')) {
                    minViewModeNumber = 2;
                }
                if (isEnabled('M')) {
                    minViewModeNumber = 1;
                }
                if (isEnabled('d')) {
                    minViewModeNumber = 0;
                }

                //minViewModeNumber = viewModes.indexOf(newMinViewMode);
                currentViewMode = Math.max(minViewModeNumber, currentViewMode);

                if (!unset) {
                    setValue(date);
                }
                return picker;
            };

            picker.disabledDates = function (dates) {
                if (arguments.length === 0) {
                    return (options.disabledDates ? $.extend({}, options.disabledDates) : options.disabledDates);
                }

                if (!dates) {
                    options.disabledDates = false;
                    update();
                    return picker;
                }
                if (!(dates instanceof Array)) {
                    throw new TypeError('disabledDates() expects an array parameter');
                }
                options.disabledDates = indexGivenDates(dates);
                options.enabledDates = false;
                update();
                return picker;
            };

            picker.enabledDates = function (dates) {
                if (arguments.length === 0) {
                    return (options.enabledDates ? $.extend({}, options.enabledDates) : options.enabledDates);
                }

                if (!dates) {
                    options.enabledDates = false;
                    update();
                    return picker;
                }
                if (!(dates instanceof Array)) {
                    throw new TypeError('enabledDates() expects an array parameter');
                }
                options.enabledDates = indexGivenDates(dates);
                options.disabledDates = false;
                update();
                return picker;
            };

            picker.daysOfWeekDisabled = function (daysOfWeekDisabled) {
                if (arguments.length === 0) {
                    return options.daysOfWeekDisabled.splice(0);
                }

                if (!(daysOfWeekDisabled instanceof Array)) {
                    throw new TypeError('daysOfWeekDisabled() expects an array parameter');
                }
                options.daysOfWeekDisabled = daysOfWeekDisabled.reduce(function (previousValue, currentValue) {
                    currentValue = parseInt(currentValue, 10);
                    if (currentValue > 6 || currentValue < 0 || isNaN(currentValue)) {
                        return previousValue;
                    }
                    if (previousValue.indexOf(currentValue) === -1) {
                        previousValue.push(currentValue);
                    }
                    return previousValue;
                }, []).sort();
                update();
                return picker;
            };

            picker.maxDate = function (date) {
                if (arguments.length === 0) {
                    return options.maxDate.clone();
                }

                if ((typeof date === 'boolean') && date === false) {
                    options.maxDate = false;
                    update();
                    return picker;
                }

                var parsedDate = parseInputDate(date);

                if (!parsedDate.isValid()) {
                    throw new TypeError('maxDate() Could not parse date variable: ' + date);
                }
                if (options.minDate && parsedDate.isBefore(options.minDate)) {
                    throw new TypeError('maxDate() date variable is before options.minDate: ' + parsedDate.format(options.format));
                }
                options.maxDate = parsedDate;
                if (options.maxDate.isBefore(date)) {
                    setValue(options.maxDate);
                }
                update();
                return picker;
            };

            picker.minDate = function (date) {
                if (arguments.length === 0) {
                    return options.minDate.clone();
                }

                if ((typeof date === 'boolean') && date === false) {
                    options.minDate = false;
                    update();
                    return picker;
                }

                var parsedDate = parseInputDate(date);

                if (!parsedDate.isValid()) {
                    throw new TypeError('minDate() Could not parse date variable: ' + date);
                }
                if (options.maxDate && parsedDate.isAfter(options.maxDate)) {
                    throw new TypeError('minDate() date variable is after options.maxDate: ' + parsedDate.format(options.format));
                }
                options.minDate = parsedDate;
                if (options.minDate.isAfter(date)) {
                    setValue(options.minDate);
                }
                update();
                return picker;
            };

            picker.defaultDate = function (defaultDate) {
                if (arguments.length === 0) {
                    return options.defaultDate ? options.defaultDate.clone() : options.defaultDate;
                }
                if (!defaultDate) {
                    options.defaultDate = false;
                    return picker;
                }
                var parsedDate = parseInputDate(defaultDate);
                if (!parsedDate.isValid()) {
                    throw new TypeError('defaultDate() Could not parse date variable: ' + defaultDate);
                }
                if (!isValid(parsedDate)) {
                    throw new TypeError('defaultDate() date passed is invalid according to component setup validations');
                }

                options.defaultDate = parsedDate;

                if (options.defaultDate && input.val().trim() === '') {
                    picker.date(options.defaultDate);
                }
                return picker;
            };

            picker.locale = function (locale) {
                if (arguments.length === 0) {
                    return options.locale;
                }

                if (!moment.localeData(locale)) {
                    throw new TypeError('locale() locale ' + locale + ' is not loaded from moment locales!');
                }

                options.locale = locale;
                date.locale(options.locale);
                viewDate.locale(options.locale);
                picker.format(options.format); // re-evaluate format variable in case options.format is not set
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            picker.stepping = function (stepping) {
                if (arguments.length === 0) {
                    return options.stepping;
                }

                stepping = parseInt(stepping, 10);
                if (isNaN(stepping) || stepping < 1) {
                    stepping = 1;
                }
                options.stepping = stepping;
                return picker;
            };

            picker.useCurrent = function (useCurrent) {
                if (arguments.length === 0) {
                    return options.useCurrent;
                }

                if ((typeof useCurrent !== 'boolean') && (typeof useCurrent !== 'string')) {
                    throw new TypeError('useCurrent() expects a boolean parameter');
                }
                options.useCurrent = useCurrent;
                return picker;
            };

            picker.collapse = function (collapse) {
                if (arguments.length === 0) {
                    return options.collapse;
                }

                if (typeof collapse !== 'boolean') {
                    throw new TypeError('collapse() expects a boolean parameter');
                }
                if (options.collapse === collapse) {
                    return picker;
                }
                options.collapse = collapse;
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            picker.icons = function (icons) {
                if (arguments.length === 0) {
                    return options.icons;
                }

                if (!(icons instanceof Object)) {
                    throw new TypeError('icons() expects parameter to be an Object');
                }
                $.extend(options.icons, icons);
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            picker.useStrict = function (useStrict) {
                if (arguments.length === 0) {
                    return options.useStrict;
                }

                if (typeof useStrict !== 'boolean') {
                    throw new TypeError('useStrict() expects a boolean parameter');
                }
                options.useStrict = useStrict;
                return picker;
            };

            picker.sideBySide = function (sideBySide) {
                if (arguments.length === 0) {
                    return options.sideBySide;
                }

                if (typeof sideBySide !== 'boolean') {
                    throw new TypeError('sideBySide() expects a boolean parameter');
                }
                options.sideBySide = sideBySide;
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            picker.widgetParent = function (widgetParent) {
                if (arguments.length === 0) {
                    return options.widgetParent;
                }

                if ((typeof widgetParent !== 'string') && ((typeof widgetParent !== 'boolean') && (widgetParent !== false))) {
                    throw new TypeError('widgetParent() expects a string or boolean:false variable ' + widgetParent);
                }

                options.widgetParent = widgetParent;
                return picker;
            };

            picker.viewMode = function (newViewMode) {
                if (arguments.length === 0) {
                    return options.viewMode;
                }

                if (typeof newViewMode !== 'string') {
                    throw new TypeError('viewMode() expects a string parameter');
                }

                if (viewModes.indexOf(newViewMode) === -1) {
                    throw new TypeError('viewMode() parameter must be one of (' + viewModes.join(', ') + ') value');
                }

                options.viewMode = newViewMode;
                currentViewMode = Math.max(viewModes.indexOf(newViewMode), minViewModeNumber);

                showMode();
                return picker;
            };

            picker.direction = function (direction) {
                if (arguments.length === 0) {
                    return options.direction;
                }

                if (typeof direction !== 'string') {
                    throw new TypeError('direction() expects a string parameter');
                }

                direction = direction.toLowerCase();

                if (directionModes.indexOf(direction) === -1) {
                    throw new TypeError('direction() expects parameter to be one of (' + directionModes.join(', ') + ')');
                }

                options.direction = direction;
                update();
                return picker;
            };

            picker.calendarWeeks = function (showCalendarWeeks) {
                if (arguments.length === 0) {
                    return options.calendarWeeks;
                }

                if (typeof showCalendarWeeks !== 'boolean') {
                    throw new TypeError('calendarWeeks() expects parameter to be a boolean value');
                }

                options.calendarWeeks = showCalendarWeeks;
                update();
                return picker;
            };

            picker.orientation = function (orientation) {
                if (arguments.length === 0) {
                    return options.orientation;
                }

                if (typeof orientation !== 'string') {
                    throw new TypeError('orientation() expects a string parameter');
                }

                orientation = orientation.toLowerCase();

                if (orientationModes.indexOf(orientation) === -1) {
                    throw new TypeError('orientation() expects parameter to be one of (' + orientationModes.join(', ') + ')');
                }

                options.orientation = orientation;
                update();
                return picker;
            };

            picker.showTodayButton = function (showTodayButton) {
                if (arguments.length === 0) {
                    return options.showTodayButton;
                }

                if (typeof showTodayButton !== 'boolean') {
                    throw new TypeError('showTodayButton() expects a boolean parameter');
                }

                options.showTodayButton = showTodayButton;
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            picker.showClear = function (showClear) {
                if (arguments.length === 0) {
                    return options.showClear;
                }

                if (typeof showClear !== 'boolean') {
                    throw new TypeError('showClear() expects a boolean parameter');
                }

                options.showClear = showClear;
                if (widget) {
                    picker.hide();
                    picker.show();
                }
                return picker;
            };

            // initializing element and component attributes
            if (element.is('input')) {
                input = element;
            } else {
                input = element.find('.datepickerinput');
                if (input.size() === 0) {
                    input = element.find('input');
                } else if (!input.is('input')) {
                    throw new Error('CSS class "datepickerinput" cannot be applied to non input element');
                }
            }

            if (element.hasClass('input-group')) {
                // in case there is more then one 'input-group-addon' Issue #48
                if (element.find('.datepickerbutton').size() === 0) {
                    component = element.find('[class^="input-group-"]');
                } else {
                    component = element.find('.datepickerbutton');
                }
            }

            if (!input.is('input')) {
                throw new Error('Could not initialize DateTimePicker without an input element');
            }

            $.extend(true, options, dataToOptions());

            picker.options(options);

            attachDatePickerElementEvents();

            if (input.prop('disabled')) {
                picker.disable();
            }

            if (input.val().trim().length !== 0) {
                picker.date(input.val().trim());
            } else if (options.defaultDate) {
                picker.date(options.defaultDate);
            }

            return picker;
        };

    /********************************************************************************
     *
     * jQuery plugin constructor and defaults object
     *
     ********************************************************************************/

    $.fn.datetimepicker = function (options) {
        return this.each(function () {
            var $this = $(this);
            if (!$this.data('DateTimePicker')) {
                // create a private copy of the defaults object
                options = $.extend(true, {}, $.fn.datetimepicker.defaults, options);
                $this.data('DateTimePicker', dateTimePicker($this, options));
            }
        });
    };

    $.fn.datetimepicker.defaults = {
        format: false,
        stepping: 1,
        minDate: false,
        maxDate: false,
        useCurrent: true,
        collapse: true,
        locale: moment.locale(),
        defaultDate: false,
        disabledDates: false,
        enabledDates: false,
        icons: {
            time :    'glyphicon glyphicon-time',
            date :    'glyphicon glyphicon-calendar',
            up   :    'glyphicon glyphicon-chevron-up',
            down :    'glyphicon glyphicon-chevron-down',
            previous: 'glyphicon glyphicon-chevron-left',
            next :    'glyphicon glyphicon-chevron-right',
            today:    'glyphicon glyphicon-screenshot',
            clear:    'glyphicon glyphicon-trash'
        },
        useStrict: false,
        direction: 'auto',
        sideBySide: false,
        daysOfWeekDisabled: [],
        widgetParent: false,
        calendarWeeks: false,
        viewMode: 'days',
        orientation: 'right',
        showTodayButton: false,
        showClear: false
    };
}));
