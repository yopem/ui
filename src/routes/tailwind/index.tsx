import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"

import Accordion1 from "@/components/demos/tailwind/p-accordion-1"
import Accordion2 from "@/components/demos/tailwind/p-accordion-2"
import Accordion3 from "@/components/demos/tailwind/p-accordion-3"
import Accordion4 from "@/components/demos/tailwind/p-accordion-4"
import Alert1 from "@/components/demos/tailwind/p-alert-1"
import Alert2 from "@/components/demos/tailwind/p-alert-2"
import Alert3 from "@/components/demos/tailwind/p-alert-3"
import Alert4 from "@/components/demos/tailwind/p-alert-4"
import Alert5 from "@/components/demos/tailwind/p-alert-5"
import Alert6 from "@/components/demos/tailwind/p-alert-6"
import Alert7 from "@/components/demos/tailwind/p-alert-7"
import AlertDialog1 from "@/components/demos/tailwind/p-alert-dialog-1"
import AlertDialog2 from "@/components/demos/tailwind/p-alert-dialog-2"
import Autocomplete1 from "@/components/demos/tailwind/p-autocomplete-1"
import Autocomplete2 from "@/components/demos/tailwind/p-autocomplete-2"
import Autocomplete3 from "@/components/demos/tailwind/p-autocomplete-3"
import Autocomplete4 from "@/components/demos/tailwind/p-autocomplete-4"
import Autocomplete5 from "@/components/demos/tailwind/p-autocomplete-5"
import Autocomplete6 from "@/components/demos/tailwind/p-autocomplete-6"
import Autocomplete7 from "@/components/demos/tailwind/p-autocomplete-7"
import Autocomplete8 from "@/components/demos/tailwind/p-autocomplete-8"
import Autocomplete9 from "@/components/demos/tailwind/p-autocomplete-9"
import Autocomplete10 from "@/components/demos/tailwind/p-autocomplete-10"
import Autocomplete11 from "@/components/demos/tailwind/p-autocomplete-11"
import Autocomplete12 from "@/components/demos/tailwind/p-autocomplete-12"
import Autocomplete13 from "@/components/demos/tailwind/p-autocomplete-13"
import Autocomplete14 from "@/components/demos/tailwind/p-autocomplete-14"
import Autocomplete15 from "@/components/demos/tailwind/p-autocomplete-15"
import Autocomplete16 from "@/components/demos/tailwind/p-autocomplete-16"
import Avatar1 from "@/components/demos/tailwind/p-avatar-1"
import Avatar2 from "@/components/demos/tailwind/p-avatar-2"
import Avatar3 from "@/components/demos/tailwind/p-avatar-3"
import Avatar4 from "@/components/demos/tailwind/p-avatar-4"
import Avatar5 from "@/components/demos/tailwind/p-avatar-5"
import Avatar6 from "@/components/demos/tailwind/p-avatar-6"
import Avatar7 from "@/components/demos/tailwind/p-avatar-7"
import Avatar8 from "@/components/demos/tailwind/p-avatar-8"
import Avatar9 from "@/components/demos/tailwind/p-avatar-9"
import Avatar10 from "@/components/demos/tailwind/p-avatar-10"
import Avatar11 from "@/components/demos/tailwind/p-avatar-11"
import Avatar12 from "@/components/demos/tailwind/p-avatar-12"
import Avatar13 from "@/components/demos/tailwind/p-avatar-13"
import Avatar14 from "@/components/demos/tailwind/p-avatar-14"
import Badge1 from "@/components/demos/tailwind/p-badge-1"
import Badge2 from "@/components/demos/tailwind/p-badge-2"
import Badge3 from "@/components/demos/tailwind/p-badge-3"
import Badge4 from "@/components/demos/tailwind/p-badge-4"
import Badge5 from "@/components/demos/tailwind/p-badge-5"
import Badge6 from "@/components/demos/tailwind/p-badge-6"
import Badge7 from "@/components/demos/tailwind/p-badge-7"
import Badge8 from "@/components/demos/tailwind/p-badge-8"
import Badge9 from "@/components/demos/tailwind/p-badge-9"
import Badge10 from "@/components/demos/tailwind/p-badge-10"
import Badge11 from "@/components/demos/tailwind/p-badge-11"
import Badge12 from "@/components/demos/tailwind/p-badge-12"
import Badge13 from "@/components/demos/tailwind/p-badge-13"
import Badge14 from "@/components/demos/tailwind/p-badge-14"
import Badge15 from "@/components/demos/tailwind/p-badge-15"
import Badge16 from "@/components/demos/tailwind/p-badge-16"
import Badge17 from "@/components/demos/tailwind/p-badge-17"
import Badge18 from "@/components/demos/tailwind/p-badge-18"
import Badge19 from "@/components/demos/tailwind/p-badge-19"
import Badge20 from "@/components/demos/tailwind/p-badge-20"
import Breadcrumb1 from "@/components/demos/tailwind/p-breadcrumb-1"
import Breadcrumb2 from "@/components/demos/tailwind/p-breadcrumb-2"
import Breadcrumb3 from "@/components/demos/tailwind/p-breadcrumb-3"
import Breadcrumb4 from "@/components/demos/tailwind/p-breadcrumb-4"
import Breadcrumb5 from "@/components/demos/tailwind/p-breadcrumb-5"
import Breadcrumb6 from "@/components/demos/tailwind/p-breadcrumb-6"
import Breadcrumb7 from "@/components/demos/tailwind/p-breadcrumb-7"
import Button1 from "@/components/demos/tailwind/p-button-1"
import Button2 from "@/components/demos/tailwind/p-button-2"
import Button3 from "@/components/demos/tailwind/p-button-3"
import Button4 from "@/components/demos/tailwind/p-button-4"
import Button5 from "@/components/demos/tailwind/p-button-5"
import Button6 from "@/components/demos/tailwind/p-button-6"
import Button7 from "@/components/demos/tailwind/p-button-7"
import Button8 from "@/components/demos/tailwind/p-button-8"
import Button9 from "@/components/demos/tailwind/p-button-9"
import Button10 from "@/components/demos/tailwind/p-button-10"
import Button11 from "@/components/demos/tailwind/p-button-11"
import Button12 from "@/components/demos/tailwind/p-button-12"
import Button13 from "@/components/demos/tailwind/p-button-13"
import Button14 from "@/components/demos/tailwind/p-button-14"
import Button15 from "@/components/demos/tailwind/p-button-15"
import Button16 from "@/components/demos/tailwind/p-button-16"
import Button17 from "@/components/demos/tailwind/p-button-17"
import Button18 from "@/components/demos/tailwind/p-button-18"
import Button19 from "@/components/demos/tailwind/p-button-19"
import Button20 from "@/components/demos/tailwind/p-button-20"
import Button21 from "@/components/demos/tailwind/p-button-21"
import Button22 from "@/components/demos/tailwind/p-button-22"
import Button23 from "@/components/demos/tailwind/p-button-23"
import Button24 from "@/components/demos/tailwind/p-button-24"
import Button26 from "@/components/demos/tailwind/p-button-26"
import Button27 from "@/components/demos/tailwind/p-button-27"
import Button28 from "@/components/demos/tailwind/p-button-28"
import Button29 from "@/components/demos/tailwind/p-button-29"
import Button30 from "@/components/demos/tailwind/p-button-30"
import Button31 from "@/components/demos/tailwind/p-button-31"
import Button32 from "@/components/demos/tailwind/p-button-32"
import Button33 from "@/components/demos/tailwind/p-button-33"
import Button34 from "@/components/demos/tailwind/p-button-34"
import Button35 from "@/components/demos/tailwind/p-button-35"
import Button36 from "@/components/demos/tailwind/p-button-36"
import Button37 from "@/components/demos/tailwind/p-button-37"
import Button38 from "@/components/demos/tailwind/p-button-38"
import Button39 from "@/components/demos/tailwind/p-button-39"
import Button40 from "@/components/demos/tailwind/p-button-40"
import Button41 from "@/components/demos/tailwind/p-button-41"
import Calendar1 from "@/components/demos/tailwind/p-calendar-1"
import Calendar2 from "@/components/demos/tailwind/p-calendar-2"
import Calendar3 from "@/components/demos/tailwind/p-calendar-3"
import Calendar4 from "@/components/demos/tailwind/p-calendar-4"
import Calendar5 from "@/components/demos/tailwind/p-calendar-5"
import Calendar6 from "@/components/demos/tailwind/p-calendar-6"
import Calendar7 from "@/components/demos/tailwind/p-calendar-7"
import Calendar8 from "@/components/demos/tailwind/p-calendar-8"
import Calendar9 from "@/components/demos/tailwind/p-calendar-9"
import Calendar10 from "@/components/demos/tailwind/p-calendar-10"
import Calendar11 from "@/components/demos/tailwind/p-calendar-11"
import Calendar12 from "@/components/demos/tailwind/p-calendar-12"
import Calendar13 from "@/components/demos/tailwind/p-calendar-13"
import Calendar14 from "@/components/demos/tailwind/p-calendar-14"
import Calendar15 from "@/components/demos/tailwind/p-calendar-15"
import Calendar16 from "@/components/demos/tailwind/p-calendar-16"
import Calendar17 from "@/components/demos/tailwind/p-calendar-17"
import Calendar18 from "@/components/demos/tailwind/p-calendar-18"
import Calendar19 from "@/components/demos/tailwind/p-calendar-19"
import Calendar20 from "@/components/demos/tailwind/p-calendar-20"
import Calendar21 from "@/components/demos/tailwind/p-calendar-21"
import Calendar22 from "@/components/demos/tailwind/p-calendar-22"
import Calendar23 from "@/components/demos/tailwind/p-calendar-23"
import Calendar24 from "@/components/demos/tailwind/p-calendar-24"
import Calendar25 from "@/components/demos/tailwind/p-calendar-25"
import Card1 from "@/components/demos/tailwind/p-card-1"
import Card2 from "@/components/demos/tailwind/p-card-2"
import Card3 from "@/components/demos/tailwind/p-card-3"
import Card4 from "@/components/demos/tailwind/p-card-4"
import Card5 from "@/components/demos/tailwind/p-card-5"
import Card6 from "@/components/demos/tailwind/p-card-6"
import Card7 from "@/components/demos/tailwind/p-card-7"
import Card8 from "@/components/demos/tailwind/p-card-8"
import Card9 from "@/components/demos/tailwind/p-card-9"
import Card10 from "@/components/demos/tailwind/p-card-10"
import Card11 from "@/components/demos/tailwind/p-card-11"
import Checkbox1 from "@/components/demos/tailwind/p-checkbox-1"
import Checkbox2 from "@/components/demos/tailwind/p-checkbox-2"
import Checkbox3 from "@/components/demos/tailwind/p-checkbox-3"
import Checkbox4 from "@/components/demos/tailwind/p-checkbox-4"
import Checkbox5 from "@/components/demos/tailwind/p-checkbox-5"
import CheckboxGroup1 from "@/components/demos/tailwind/p-checkbox-group-1"
import CheckboxGroup2 from "@/components/demos/tailwind/p-checkbox-group-2"
import CheckboxGroup3 from "@/components/demos/tailwind/p-checkbox-group-3"
import CheckboxGroup4 from "@/components/demos/tailwind/p-checkbox-group-4"
import CheckboxGroup5 from "@/components/demos/tailwind/p-checkbox-group-5"
import Collapsible1 from "@/components/demos/tailwind/p-collapsible-1"
import Combobox1 from "@/components/demos/tailwind/p-combobox-1"
import Combobox2 from "@/components/demos/tailwind/p-combobox-2"
import Combobox3 from "@/components/demos/tailwind/p-combobox-3"
import Combobox4 from "@/components/demos/tailwind/p-combobox-4"
import Combobox5 from "@/components/demos/tailwind/p-combobox-5"
import Combobox6 from "@/components/demos/tailwind/p-combobox-6"
import Combobox7 from "@/components/demos/tailwind/p-combobox-7"
import Combobox8 from "@/components/demos/tailwind/p-combobox-8"
import Combobox9 from "@/components/demos/tailwind/p-combobox-9"
import Combobox10 from "@/components/demos/tailwind/p-combobox-10"
import Combobox11 from "@/components/demos/tailwind/p-combobox-11"
import Combobox12 from "@/components/demos/tailwind/p-combobox-12"
import Combobox13 from "@/components/demos/tailwind/p-combobox-13"
import Combobox14 from "@/components/demos/tailwind/p-combobox-14"
import Combobox15 from "@/components/demos/tailwind/p-combobox-15"
import Combobox16 from "@/components/demos/tailwind/p-combobox-16"
import Combobox17 from "@/components/demos/tailwind/p-combobox-17"
import Combobox18 from "@/components/demos/tailwind/p-combobox-18"
import Combobox19 from "@/components/demos/tailwind/p-combobox-19"
import Combobox20 from "@/components/demos/tailwind/p-combobox-20"
import Command1 from "@/components/demos/tailwind/p-command-1"
import Command2 from "@/components/demos/tailwind/p-command-2"
import ContextMenu1 from "@/components/demos/tailwind/p-context-menu-1"
import ContextMenu2 from "@/components/demos/tailwind/p-context-menu-2"
import ContextMenu3 from "@/components/demos/tailwind/p-context-menu-3"
import ContextMenu4 from "@/components/demos/tailwind/p-context-menu-4"
import ContextMenu5 from "@/components/demos/tailwind/p-context-menu-5"
import ContextMenu6 from "@/components/demos/tailwind/p-context-menu-6"
import ContextMenu7 from "@/components/demos/tailwind/p-context-menu-7"
import ContextMenu8 from "@/components/demos/tailwind/p-context-menu-8"
import DatePicker1 from "@/components/demos/tailwind/p-date-picker-1"
import DatePicker2 from "@/components/demos/tailwind/p-date-picker-2"
import DatePicker3 from "@/components/demos/tailwind/p-date-picker-3"
import DatePicker4 from "@/components/demos/tailwind/p-date-picker-4"
import DatePicker5 from "@/components/demos/tailwind/p-date-picker-5"
import DatePicker6 from "@/components/demos/tailwind/p-date-picker-6"
import DatePicker7 from "@/components/demos/tailwind/p-date-picker-7"
import DatePicker8 from "@/components/demos/tailwind/p-date-picker-8"
import DatePicker9 from "@/components/demos/tailwind/p-date-picker-9"
import Dialog1 from "@/components/demos/tailwind/p-dialog-1"
import Dialog2 from "@/components/demos/tailwind/p-dialog-2"
import Dialog3 from "@/components/demos/tailwind/p-dialog-3"
import Dialog4 from "@/components/demos/tailwind/p-dialog-4"
import Dialog5 from "@/components/demos/tailwind/p-dialog-5"
import Dialog6 from "@/components/demos/tailwind/p-dialog-6"
import Drawer1 from "@/components/demos/tailwind/p-drawer-1"
import Drawer2 from "@/components/demos/tailwind/p-drawer-2"
import Drawer3 from "@/components/demos/tailwind/p-drawer-3"
import Drawer4 from "@/components/demos/tailwind/p-drawer-4"
import Drawer5 from "@/components/demos/tailwind/p-drawer-5"
import Drawer6 from "@/components/demos/tailwind/p-drawer-6"
import Drawer7 from "@/components/demos/tailwind/p-drawer-7"
import Drawer8 from "@/components/demos/tailwind/p-drawer-8"
import Drawer9 from "@/components/demos/tailwind/p-drawer-9"
import Drawer10 from "@/components/demos/tailwind/p-drawer-10"
import Drawer11 from "@/components/demos/tailwind/p-drawer-11"
import Drawer12 from "@/components/demos/tailwind/p-drawer-12"
import Drawer13 from "@/components/demos/tailwind/p-drawer-13"
import Drawer14 from "@/components/demos/tailwind/p-drawer-14"
import Empty1 from "@/components/demos/tailwind/p-empty-1"
import Field1 from "@/components/demos/tailwind/p-field-1"
import Field2 from "@/components/demos/tailwind/p-field-2"
import Field3 from "@/components/demos/tailwind/p-field-3"
import Field4 from "@/components/demos/tailwind/p-field-4"
import Field5 from "@/components/demos/tailwind/p-field-5"
import Field6 from "@/components/demos/tailwind/p-field-6"
import Field7 from "@/components/demos/tailwind/p-field-7"
import Field8 from "@/components/demos/tailwind/p-field-8"
import Field9 from "@/components/demos/tailwind/p-field-9"
import Field10 from "@/components/demos/tailwind/p-field-10"
import Field11 from "@/components/demos/tailwind/p-field-11"
import Field12 from "@/components/demos/tailwind/p-field-12"
import Field13 from "@/components/demos/tailwind/p-field-13"
import Field14 from "@/components/demos/tailwind/p-field-14"
import Field15 from "@/components/demos/tailwind/p-field-15"
import Field16 from "@/components/demos/tailwind/p-field-16"
import Field17 from "@/components/demos/tailwind/p-field-17"
import Field18 from "@/components/demos/tailwind/p-field-18"
import Fieldset1 from "@/components/demos/tailwind/p-fieldset-1"
import Form1 from "@/components/demos/tailwind/p-form-1"
import Form2 from "@/components/demos/tailwind/p-form-2"
import Frame1 from "@/components/demos/tailwind/p-frame-1"
import Frame2 from "@/components/demos/tailwind/p-frame-2"
import Frame3 from "@/components/demos/tailwind/p-frame-3"
import Frame4 from "@/components/demos/tailwind/p-frame-4"
import Group1 from "@/components/demos/tailwind/p-group-1"
import Group2 from "@/components/demos/tailwind/p-group-2"
import Group3 from "@/components/demos/tailwind/p-group-3"
import Group4 from "@/components/demos/tailwind/p-group-4"
import Group5 from "@/components/demos/tailwind/p-group-5"
import Group6 from "@/components/demos/tailwind/p-group-6"
import Group7 from "@/components/demos/tailwind/p-group-7"
import Group8 from "@/components/demos/tailwind/p-group-8"
import Group9 from "@/components/demos/tailwind/p-group-9"
import Group10 from "@/components/demos/tailwind/p-group-10"
import Group11 from "@/components/demos/tailwind/p-group-11"
import Group12 from "@/components/demos/tailwind/p-group-12"
import Group13 from "@/components/demos/tailwind/p-group-13"
import Group14 from "@/components/demos/tailwind/p-group-14"
import Group15 from "@/components/demos/tailwind/p-group-15"
import Group16 from "@/components/demos/tailwind/p-group-16"
import Group17 from "@/components/demos/tailwind/p-group-17"
import Group18 from "@/components/demos/tailwind/p-group-18"
import Group19 from "@/components/demos/tailwind/p-group-19"
import Group20 from "@/components/demos/tailwind/p-group-20"
import Group22 from "@/components/demos/tailwind/p-group-22"
import Group23 from "@/components/demos/tailwind/p-group-23"
import Input1 from "@/components/demos/tailwind/p-input-1"
import Input2 from "@/components/demos/tailwind/p-input-2"
import Input3 from "@/components/demos/tailwind/p-input-3"
import Input4 from "@/components/demos/tailwind/p-input-4"
import Input5 from "@/components/demos/tailwind/p-input-5"
import Input6 from "@/components/demos/tailwind/p-input-6"
import Input7 from "@/components/demos/tailwind/p-input-7"
import Input8 from "@/components/demos/tailwind/p-input-8"
import Input9 from "@/components/demos/tailwind/p-input-9"
import Input10 from "@/components/demos/tailwind/p-input-10"
import Input11 from "@/components/demos/tailwind/p-input-11"
import Input12 from "@/components/demos/tailwind/p-input-12"
import Input13 from "@/components/demos/tailwind/p-input-13"
import Input14 from "@/components/demos/tailwind/p-input-14"
import Input15 from "@/components/demos/tailwind/p-input-15"
import Input16 from "@/components/demos/tailwind/p-input-16"
import Input17 from "@/components/demos/tailwind/p-input-17"
import Input18 from "@/components/demos/tailwind/p-input-18"
import Input19 from "@/components/demos/tailwind/p-input-19"
import InputGroup1 from "@/components/demos/tailwind/p-input-group-1"
import InputGroup2 from "@/components/demos/tailwind/p-input-group-2"
import InputGroup3 from "@/components/demos/tailwind/p-input-group-3"
import InputGroup4 from "@/components/demos/tailwind/p-input-group-4"
import InputGroup5 from "@/components/demos/tailwind/p-input-group-5"
import InputGroup6 from "@/components/demos/tailwind/p-input-group-6"
import InputGroup7 from "@/components/demos/tailwind/p-input-group-7"
import InputGroup8 from "@/components/demos/tailwind/p-input-group-8"
import InputGroup9 from "@/components/demos/tailwind/p-input-group-9"
import InputGroup10 from "@/components/demos/tailwind/p-input-group-10"
import InputGroup11 from "@/components/demos/tailwind/p-input-group-11"
import InputGroup12 from "@/components/demos/tailwind/p-input-group-12"
import InputGroup13 from "@/components/demos/tailwind/p-input-group-13"
import InputGroup14 from "@/components/demos/tailwind/p-input-group-14"
import InputGroup15 from "@/components/demos/tailwind/p-input-group-15"
import InputGroup16 from "@/components/demos/tailwind/p-input-group-16"
import InputGroup17 from "@/components/demos/tailwind/p-input-group-17"
import InputGroup18 from "@/components/demos/tailwind/p-input-group-18"
import InputGroup19 from "@/components/demos/tailwind/p-input-group-19"
import InputGroup20 from "@/components/demos/tailwind/p-input-group-20"
import InputGroup21 from "@/components/demos/tailwind/p-input-group-21"
import InputGroup22 from "@/components/demos/tailwind/p-input-group-22"
import InputGroup23 from "@/components/demos/tailwind/p-input-group-23"
import InputGroup24 from "@/components/demos/tailwind/p-input-group-24"
import InputGroup26 from "@/components/demos/tailwind/p-input-group-26"
import InputGroup27 from "@/components/demos/tailwind/p-input-group-27"
import InputGroup28 from "@/components/demos/tailwind/p-input-group-28"
import InputGroup29 from "@/components/demos/tailwind/p-input-group-29"
import Kbd1 from "@/components/demos/tailwind/p-kbd-1"
import Menu1 from "@/components/demos/tailwind/p-menu-1"
import Menu2 from "@/components/demos/tailwind/p-menu-2"
import Menu3 from "@/components/demos/tailwind/p-menu-3"
import Menu4 from "@/components/demos/tailwind/p-menu-4"
import Menu5 from "@/components/demos/tailwind/p-menu-5"
import Menu6 from "@/components/demos/tailwind/p-menu-6"
import Menu7 from "@/components/demos/tailwind/p-menu-7"
import Menu8 from "@/components/demos/tailwind/p-menu-8"
import Menu9 from "@/components/demos/tailwind/p-menu-9"
import Meter1 from "@/components/demos/tailwind/p-meter-1"
import Meter2 from "@/components/demos/tailwind/p-meter-2"
import Meter3 from "@/components/demos/tailwind/p-meter-3"
import Meter4 from "@/components/demos/tailwind/p-meter-4"
import Navigation1 from "@/components/demos/tailwind/p-navigation-1"
import Navigation2 from "@/components/demos/tailwind/p-navigation-2"
import Navigation3 from "@/components/demos/tailwind/p-navigation-3"
import NumberField1 from "@/components/demos/tailwind/p-number-field-1"
import NumberField2 from "@/components/demos/tailwind/p-number-field-2"
import NumberField3 from "@/components/demos/tailwind/p-number-field-3"
import NumberField4 from "@/components/demos/tailwind/p-number-field-4"
import NumberField5 from "@/components/demos/tailwind/p-number-field-5"
import NumberField6 from "@/components/demos/tailwind/p-number-field-6"
import NumberField7 from "@/components/demos/tailwind/p-number-field-7"
import NumberField8 from "@/components/demos/tailwind/p-number-field-8"
import NumberField9 from "@/components/demos/tailwind/p-number-field-9"
import NumberField10 from "@/components/demos/tailwind/p-number-field-10"
import NumberField11 from "@/components/demos/tailwind/p-number-field-11"
import OtpField1 from "@/components/demos/tailwind/p-otp-field-1"
import OtpField2 from "@/components/demos/tailwind/p-otp-field-2"
import OtpField3 from "@/components/demos/tailwind/p-otp-field-3"
import OtpField4 from "@/components/demos/tailwind/p-otp-field-4"
import OtpField6 from "@/components/demos/tailwind/p-otp-field-6"
import OtpField7 from "@/components/demos/tailwind/p-otp-field-7"
import OtpField8 from "@/components/demos/tailwind/p-otp-field-8"
import OtpField9 from "@/components/demos/tailwind/p-otp-field-9"
import OtpField10 from "@/components/demos/tailwind/p-otp-field-10"
import Pagination1 from "@/components/demos/tailwind/p-pagination-1"
import Pagination2 from "@/components/demos/tailwind/p-pagination-2"
import Pagination3 from "@/components/demos/tailwind/p-pagination-3"
import Popover1 from "@/components/demos/tailwind/p-popover-1"
import Popover2 from "@/components/demos/tailwind/p-popover-2"
import Popover3 from "@/components/demos/tailwind/p-popover-3"
import Popover4 from "@/components/demos/tailwind/p-popover-4"
import PreviewCard1 from "@/components/demos/tailwind/p-preview-card-1"
import Progress1 from "@/components/demos/tailwind/p-progress-1"
import Progress2 from "@/components/demos/tailwind/p-progress-2"
import Progress3 from "@/components/demos/tailwind/p-progress-3"
import RadioGroup1 from "@/components/demos/tailwind/p-radio-group-1"
import RadioGroup2 from "@/components/demos/tailwind/p-radio-group-2"
import RadioGroup3 from "@/components/demos/tailwind/p-radio-group-3"
import RadioGroup4 from "@/components/demos/tailwind/p-radio-group-4"
import RadioGroup5 from "@/components/demos/tailwind/p-radio-group-5"
import RadioGroup6 from "@/components/demos/tailwind/p-radio-group-6"
import RadioGroup7 from "@/components/demos/tailwind/p-radio-group-7"
import RadioGroup8 from "@/components/demos/tailwind/p-radio-group-8"
import RadioGroup9 from "@/components/demos/tailwind/p-radio-group-9"
import ScrollArea1 from "@/components/demos/tailwind/p-scroll-area-1"
import ScrollArea2 from "@/components/demos/tailwind/p-scroll-area-2"
import ScrollArea3 from "@/components/demos/tailwind/p-scroll-area-3"
import ScrollArea4 from "@/components/demos/tailwind/p-scroll-area-4"
import ScrollArea5 from "@/components/demos/tailwind/p-scroll-area-5"
import Select1 from "@/components/demos/tailwind/p-select-1"
import Select2 from "@/components/demos/tailwind/p-select-2"
import Select3 from "@/components/demos/tailwind/p-select-3"
import Select4 from "@/components/demos/tailwind/p-select-4"
import Select5 from "@/components/demos/tailwind/p-select-5"
import Select6 from "@/components/demos/tailwind/p-select-6"
import Select7 from "@/components/demos/tailwind/p-select-7"
import Select8 from "@/components/demos/tailwind/p-select-8"
import Select9 from "@/components/demos/tailwind/p-select-9"
import Select10 from "@/components/demos/tailwind/p-select-10"
import Select11 from "@/components/demos/tailwind/p-select-11"
import Select12 from "@/components/demos/tailwind/p-select-12"
import Select13 from "@/components/demos/tailwind/p-select-13"
import Select14 from "@/components/demos/tailwind/p-select-14"
import Select15 from "@/components/demos/tailwind/p-select-15"
import Select16 from "@/components/demos/tailwind/p-select-16"
import Select17 from "@/components/demos/tailwind/p-select-17"
import Select18 from "@/components/demos/tailwind/p-select-18"
import Select19 from "@/components/demos/tailwind/p-select-19"
import Select20 from "@/components/demos/tailwind/p-select-20"
import Select21 from "@/components/demos/tailwind/p-select-21"
import Select22 from "@/components/demos/tailwind/p-select-22"
import Select23 from "@/components/demos/tailwind/p-select-23"
import Separator1 from "@/components/demos/tailwind/p-separator-1"
import Sheet1 from "@/components/demos/tailwind/p-sheet-1"
import Sheet2 from "@/components/demos/tailwind/p-sheet-2"
import Sheet3 from "@/components/demos/tailwind/p-sheet-3"
import Skeleton1 from "@/components/demos/tailwind/p-skeleton-1"
import Skeleton2 from "@/components/demos/tailwind/p-skeleton-2"
import Slider1 from "@/components/demos/tailwind/p-slider-1"
import Slider2 from "@/components/demos/tailwind/p-slider-2"
import Slider3 from "@/components/demos/tailwind/p-slider-3"
import Slider4 from "@/components/demos/tailwind/p-slider-4"
import Slider5 from "@/components/demos/tailwind/p-slider-5"
import Slider6 from "@/components/demos/tailwind/p-slider-6"
import Slider7 from "@/components/demos/tailwind/p-slider-7"
import Slider8 from "@/components/demos/tailwind/p-slider-8"
import Slider9 from "@/components/demos/tailwind/p-slider-9"
import Slider10 from "@/components/demos/tailwind/p-slider-10"
import Slider11 from "@/components/demos/tailwind/p-slider-11"
import Slider12 from "@/components/demos/tailwind/p-slider-12"
import Slider13 from "@/components/demos/tailwind/p-slider-13"
import Slider14 from "@/components/demos/tailwind/p-slider-14"
import Slider15 from "@/components/demos/tailwind/p-slider-15"
import Slider16 from "@/components/demos/tailwind/p-slider-16"
import Slider17 from "@/components/demos/tailwind/p-slider-17"
import Slider18 from "@/components/demos/tailwind/p-slider-18"
import Slider19 from "@/components/demos/tailwind/p-slider-19"
import Slider20 from "@/components/demos/tailwind/p-slider-20"
import Slider21 from "@/components/demos/tailwind/p-slider-21"
import Slider22 from "@/components/demos/tailwind/p-slider-22"
import Slider23 from "@/components/demos/tailwind/p-slider-23"
import Spinner1 from "@/components/demos/tailwind/p-spinner-1"
import Switch1 from "@/components/demos/tailwind/p-switch-1"
import Switch2 from "@/components/demos/tailwind/p-switch-2"
import Switch3 from "@/components/demos/tailwind/p-switch-3"
import Switch4 from "@/components/demos/tailwind/p-switch-4"
import Switch5 from "@/components/demos/tailwind/p-switch-5"
import Switch6 from "@/components/demos/tailwind/p-switch-6"
import Switch7 from "@/components/demos/tailwind/p-switch-7"
import Switch8 from "@/components/demos/tailwind/p-switch-8"
import Switch9 from "@/components/demos/tailwind/p-switch-9"
import Table1 from "@/components/demos/tailwind/p-table-1"
import Table2 from "@/components/demos/tailwind/p-table-2"
import Table3 from "@/components/demos/tailwind/p-table-3"
import Table4 from "@/components/demos/tailwind/p-table-4"
import Table5 from "@/components/demos/tailwind/p-table-5"
import Table6 from "@/components/demos/tailwind/p-table-6"
import Table7 from "@/components/demos/tailwind/p-table-7"
import Table8 from "@/components/demos/tailwind/p-table-8"
import Tabs1 from "@/components/demos/tailwind/p-tabs-1"
import Tabs2 from "@/components/demos/tailwind/p-tabs-2"
import Tabs3 from "@/components/demos/tailwind/p-tabs-3"
import Tabs4 from "@/components/demos/tailwind/p-tabs-4"
import Tabs5 from "@/components/demos/tailwind/p-tabs-5"
import Tabs6 from "@/components/demos/tailwind/p-tabs-6"
import Tabs7 from "@/components/demos/tailwind/p-tabs-7"
import Tabs8 from "@/components/demos/tailwind/p-tabs-8"
import Tabs9 from "@/components/demos/tailwind/p-tabs-9"
import Tabs10 from "@/components/demos/tailwind/p-tabs-10"
import Tabs11 from "@/components/demos/tailwind/p-tabs-11"
import Tabs12 from "@/components/demos/tailwind/p-tabs-12"
import Tabs13 from "@/components/demos/tailwind/p-tabs-13"
import Tabs14 from "@/components/demos/tailwind/p-tabs-14"
import Tabs15 from "@/components/demos/tailwind/p-tabs-15"
import Textarea1 from "@/components/demos/tailwind/p-textarea-1"
import Textarea2 from "@/components/demos/tailwind/p-textarea-2"
import Textarea3 from "@/components/demos/tailwind/p-textarea-3"
import Textarea4 from "@/components/demos/tailwind/p-textarea-4"
import Textarea5 from "@/components/demos/tailwind/p-textarea-5"
import Textarea6 from "@/components/demos/tailwind/p-textarea-6"
import Textarea7 from "@/components/demos/tailwind/p-textarea-7"
import Textarea8 from "@/components/demos/tailwind/p-textarea-8"
import Textarea9 from "@/components/demos/tailwind/p-textarea-9"
import Textarea10 from "@/components/demos/tailwind/p-textarea-10"
import Textarea11 from "@/components/demos/tailwind/p-textarea-11"
import Textarea12 from "@/components/demos/tailwind/p-textarea-12"
import Textarea13 from "@/components/demos/tailwind/p-textarea-13"
import Textarea14 from "@/components/demos/tailwind/p-textarea-14"
import Textarea15 from "@/components/demos/tailwind/p-textarea-15"
import Toast1 from "@/components/demos/tailwind/p-toast-1"
import Toast2 from "@/components/demos/tailwind/p-toast-2"
import Toast3 from "@/components/demos/tailwind/p-toast-3"
import Toast4 from "@/components/demos/tailwind/p-toast-4"
import Toast5 from "@/components/demos/tailwind/p-toast-5"
import Toast6 from "@/components/demos/tailwind/p-toast-6"
import Toast7 from "@/components/demos/tailwind/p-toast-7"
import Toast8 from "@/components/demos/tailwind/p-toast-8"
import Toast9 from "@/components/demos/tailwind/p-toast-9"
import Toast10 from "@/components/demos/tailwind/p-toast-10"
import Toast11 from "@/components/demos/tailwind/p-toast-11"
import Toast12 from "@/components/demos/tailwind/p-toast-12"
import Toast13 from "@/components/demos/tailwind/p-toast-13"
import Toggle1 from "@/components/demos/tailwind/p-toggle-1"
import Toggle2 from "@/components/demos/tailwind/p-toggle-2"
import Toggle3 from "@/components/demos/tailwind/p-toggle-3"
import Toggle4 from "@/components/demos/tailwind/p-toggle-4"
import Toggle5 from "@/components/demos/tailwind/p-toggle-5"
import Toggle6 from "@/components/demos/tailwind/p-toggle-6"
import Toggle7 from "@/components/demos/tailwind/p-toggle-7"
import Toggle8 from "@/components/demos/tailwind/p-toggle-8"
import ToggleGroup1 from "@/components/demos/tailwind/p-toggle-group-1"
import ToggleGroup2 from "@/components/demos/tailwind/p-toggle-group-2"
import ToggleGroup3 from "@/components/demos/tailwind/p-toggle-group-3"
import ToggleGroup4 from "@/components/demos/tailwind/p-toggle-group-4"
import ToggleGroup5 from "@/components/demos/tailwind/p-toggle-group-5"
import ToggleGroup6 from "@/components/demos/tailwind/p-toggle-group-6"
import ToggleGroup7 from "@/components/demos/tailwind/p-toggle-group-7"
import ToggleGroup8 from "@/components/demos/tailwind/p-toggle-group-8"
import ToggleGroup9 from "@/components/demos/tailwind/p-toggle-group-9"
import Toolbar1 from "@/components/demos/tailwind/p-toolbar-1"
import Tooltip1 from "@/components/demos/tailwind/p-tooltip-1"
import Tooltip2 from "@/components/demos/tailwind/p-tooltip-2"
import Tooltip3 from "@/components/demos/tailwind/p-tooltip-3"
import Tooltip4 from "@/components/demos/tailwind/p-tooltip-4"
import { buttonVariants } from "@/components/ui/tailwind/button"
import { ToastProvider } from "@/components/ui/tailwind/toast"
import appCss from "@/styles.css?url"

export const Route = createFileRoute("/tailwind/")({
  head: () => ({ links: [{ href: appCss, rel: "stylesheet" }] }),
  component: RouteComponent,
})

function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="bg-card scroll-mt-6 rounded-2xl border p-6 shadow-xs/5"
      id={id}
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {desc ? (
        <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function DemoCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background overflow-hidden rounded-xl border">
      <div className="text-muted-foreground bg-muted/30 border-b px-3 py-1.5 text-xs font-medium">
        {label}
      </div>
      <div className="flex min-h-[100px] items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}

// each entry = one modular "page" — autoloaded via infinite scroll
const SECTIONS: {
  id: string
  title: string
  desc?: string
  content: React.ReactNode
}[] = [
  {
    id: "accordion",
    title: "Accordion",
    desc: "A set of collapsible panels with headings and content.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-accordion-1">
          <Accordion1 />
        </DemoCard>
        <DemoCard label="p-accordion-2">
          <Accordion2 />
        </DemoCard>
        <DemoCard label="p-accordion-3">
          <Accordion3 />
        </DemoCard>
        <DemoCard label="p-accordion-4">
          <Accordion4 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "alert",
    title: "Alert",
    desc: "A callout for displaying important information.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-alert-1">
          <Alert1 />
        </DemoCard>
        <DemoCard label="p-alert-2">
          <Alert2 />
        </DemoCard>
        <DemoCard label="p-alert-3">
          <Alert3 />
        </DemoCard>
        <DemoCard label="p-alert-4">
          <Alert4 />
        </DemoCard>
        <DemoCard label="p-alert-5">
          <Alert5 />
        </DemoCard>
        <DemoCard label="p-alert-6">
          <Alert6 />
        </DemoCard>
        <DemoCard label="p-alert-7">
          <Alert7 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "alert-dialog",
    title: "Alert Dialog",
    desc: "A dialog that requires user response to proceed.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-alert-dialog-1">
          <AlertDialog1 />
        </DemoCard>
        <DemoCard label="p-alert-dialog-2">
          <AlertDialog2 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "autocomplete",
    title: "Autocomplete",
    desc: "An input that suggests options as you type.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-autocomplete-1">
          <Autocomplete1 />
        </DemoCard>
        <DemoCard label="p-autocomplete-2">
          <Autocomplete2 />
        </DemoCard>
        <DemoCard label="p-autocomplete-3">
          <Autocomplete3 />
        </DemoCard>
        <DemoCard label="p-autocomplete-4">
          <Autocomplete4 />
        </DemoCard>
        <DemoCard label="p-autocomplete-5">
          <Autocomplete5 />
        </DemoCard>
        <DemoCard label="p-autocomplete-6">
          <Autocomplete6 />
        </DemoCard>
        <DemoCard label="p-autocomplete-7">
          <Autocomplete7 />
        </DemoCard>
        <DemoCard label="p-autocomplete-8">
          <Autocomplete8 />
        </DemoCard>
        <DemoCard label="p-autocomplete-9">
          <Autocomplete9 />
        </DemoCard>
        <DemoCard label="p-autocomplete-10">
          <Autocomplete10 />
        </DemoCard>
        <DemoCard label="p-autocomplete-11">
          <Autocomplete11 />
        </DemoCard>
        <DemoCard label="p-autocomplete-12">
          <Autocomplete12 />
        </DemoCard>
        <DemoCard label="p-autocomplete-13">
          <Autocomplete13 />
        </DemoCard>
        <DemoCard label="p-autocomplete-14">
          <Autocomplete14 />
        </DemoCard>
        <DemoCard label="p-autocomplete-15">
          <Autocomplete15 />
        </DemoCard>
        <DemoCard label="p-autocomplete-16">
          <Autocomplete16 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "avatar",
    title: "Avatar",
    desc: "An image element with a fallback for representing the user.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-avatar-1">
          <Avatar1 />
        </DemoCard>
        <DemoCard label="p-avatar-2">
          <Avatar2 />
        </DemoCard>
        <DemoCard label="p-avatar-3">
          <Avatar3 />
        </DemoCard>
        <DemoCard label="p-avatar-4">
          <Avatar4 />
        </DemoCard>
        <DemoCard label="p-avatar-5">
          <Avatar5 />
        </DemoCard>
        <DemoCard label="p-avatar-6">
          <Avatar6 />
        </DemoCard>
        <DemoCard label="p-avatar-7">
          <Avatar7 />
        </DemoCard>
        <DemoCard label="p-avatar-8">
          <Avatar8 />
        </DemoCard>
        <DemoCard label="p-avatar-9">
          <Avatar9 />
        </DemoCard>
        <DemoCard label="p-avatar-10">
          <Avatar10 />
        </DemoCard>
        <DemoCard label="p-avatar-11">
          <Avatar11 />
        </DemoCard>
        <DemoCard label="p-avatar-12">
          <Avatar12 />
        </DemoCard>
        <DemoCard label="p-avatar-13">
          <Avatar13 />
        </DemoCard>
        <DemoCard label="p-avatar-14">
          <Avatar14 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "badge",
    title: "Badge",
    desc: "A badge or a component that looks like a badge.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-badge-1">
          <Badge1 />
        </DemoCard>
        <DemoCard label="p-badge-2">
          <Badge2 />
        </DemoCard>
        <DemoCard label="p-badge-3">
          <Badge3 />
        </DemoCard>
        <DemoCard label="p-badge-4">
          <Badge4 />
        </DemoCard>
        <DemoCard label="p-badge-5">
          <Badge5 />
        </DemoCard>
        <DemoCard label="p-badge-6">
          <Badge6 />
        </DemoCard>
        <DemoCard label="p-badge-7">
          <Badge7 />
        </DemoCard>
        <DemoCard label="p-badge-8">
          <Badge8 />
        </DemoCard>
        <DemoCard label="p-badge-9">
          <Badge9 />
        </DemoCard>
        <DemoCard label="p-badge-10">
          <Badge10 />
        </DemoCard>
        <DemoCard label="p-badge-11">
          <Badge11 />
        </DemoCard>
        <DemoCard label="p-badge-12">
          <Badge12 />
        </DemoCard>
        <DemoCard label="p-badge-13">
          <Badge13 />
        </DemoCard>
        <DemoCard label="p-badge-14">
          <Badge14 />
        </DemoCard>
        <DemoCard label="p-badge-15">
          <Badge15 />
        </DemoCard>
        <DemoCard label="p-badge-16">
          <Badge16 />
        </DemoCard>
        <DemoCard label="p-badge-17">
          <Badge17 />
        </DemoCard>
        <DemoCard label="p-badge-18">
          <Badge18 />
        </DemoCard>
        <DemoCard label="p-badge-19">
          <Badge19 />
        </DemoCard>
        <DemoCard label="p-badge-20">
          <Badge20 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "breadcrumb",
    title: "Breadcrumb",
    desc: "Displays the path to the current resource using a hierarchy of links.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-breadcrumb-1">
          <Breadcrumb1 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-2">
          <Breadcrumb2 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-3">
          <Breadcrumb3 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-4">
          <Breadcrumb4 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-5">
          <Breadcrumb5 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-6">
          <Breadcrumb6 />
        </DemoCard>
        <DemoCard label="p-breadcrumb-7">
          <Breadcrumb7 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "button",
    title: "Button",
    desc: "A button or a component that looks like a button.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-button-1">
          <Button1 />
        </DemoCard>
        <DemoCard label="p-button-2">
          <Button2 />
        </DemoCard>
        <DemoCard label="p-button-3">
          <Button3 />
        </DemoCard>
        <DemoCard label="p-button-4">
          <Button4 />
        </DemoCard>
        <DemoCard label="p-button-5">
          <Button5 />
        </DemoCard>
        <DemoCard label="p-button-6">
          <Button6 />
        </DemoCard>
        <DemoCard label="p-button-7">
          <Button7 />
        </DemoCard>
        <DemoCard label="p-button-8">
          <Button8 />
        </DemoCard>
        <DemoCard label="p-button-9">
          <Button9 />
        </DemoCard>
        <DemoCard label="p-button-10">
          <Button10 />
        </DemoCard>
        <DemoCard label="p-button-11">
          <Button11 />
        </DemoCard>
        <DemoCard label="p-button-12">
          <Button12 />
        </DemoCard>
        <DemoCard label="p-button-13">
          <Button13 />
        </DemoCard>
        <DemoCard label="p-button-14">
          <Button14 />
        </DemoCard>
        <DemoCard label="p-button-15">
          <Button15 />
        </DemoCard>
        <DemoCard label="p-button-16">
          <Button16 />
        </DemoCard>
        <DemoCard label="p-button-17">
          <Button17 />
        </DemoCard>
        <DemoCard label="p-button-18">
          <Button18 />
        </DemoCard>
        <DemoCard label="p-button-19">
          <Button19 />
        </DemoCard>
        <DemoCard label="p-button-20">
          <Button20 />
        </DemoCard>
        <DemoCard label="p-button-21">
          <Button21 />
        </DemoCard>
        <DemoCard label="p-button-22">
          <Button22 />
        </DemoCard>
        <DemoCard label="p-button-23">
          <Button23 />
        </DemoCard>
        <DemoCard label="p-button-24">
          <Button24 />
        </DemoCard>
        <DemoCard label="p-button-26">
          <Button26 />
        </DemoCard>
        <DemoCard label="p-button-27">
          <Button27 />
        </DemoCard>
        <DemoCard label="p-button-28">
          <Button28 />
        </DemoCard>
        <DemoCard label="p-button-29">
          <Button29 />
        </DemoCard>
        <DemoCard label="p-button-30">
          <Button30 />
        </DemoCard>
        <DemoCard label="p-button-31">
          <Button31 />
        </DemoCard>
        <DemoCard label="p-button-32">
          <Button32 />
        </DemoCard>
        <DemoCard label="p-button-33">
          <Button33 />
        </DemoCard>
        <DemoCard label="p-button-34">
          <Button34 />
        </DemoCard>
        <DemoCard label="p-button-35">
          <Button35 />
        </DemoCard>
        <DemoCard label="p-button-36">
          <Button36 />
        </DemoCard>
        <DemoCard label="p-button-37">
          <Button37 />
        </DemoCard>
        <DemoCard label="p-button-38">
          <Button38 />
        </DemoCard>
        <DemoCard label="p-button-39">
          <Button39 />
        </DemoCard>
        <DemoCard label="p-button-40">
          <Button40 />
        </DemoCard>
        <DemoCard label="p-button-41">
          <Button41 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "calendar",
    title: "Calendar",
    desc: "A date picker component with range and multi-select support.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-calendar-1">
          <Calendar1 />
        </DemoCard>
        <DemoCard label="p-calendar-2">
          <Calendar2 />
        </DemoCard>
        <DemoCard label="p-calendar-3">
          <Calendar3 />
        </DemoCard>
        <DemoCard label="p-calendar-4">
          <Calendar4 />
        </DemoCard>
        <DemoCard label="p-calendar-5">
          <Calendar5 />
        </DemoCard>
        <DemoCard label="p-calendar-6">
          <Calendar6 />
        </DemoCard>
        <DemoCard label="p-calendar-7">
          <Calendar7 />
        </DemoCard>
        <DemoCard label="p-calendar-8">
          <Calendar8 />
        </DemoCard>
        <DemoCard label="p-calendar-9">
          <Calendar9 />
        </DemoCard>
        <DemoCard label="p-calendar-10">
          <Calendar10 />
        </DemoCard>
        <DemoCard label="p-calendar-11">
          <Calendar11 />
        </DemoCard>
        <DemoCard label="p-calendar-12">
          <Calendar12 />
        </DemoCard>
        <DemoCard label="p-calendar-13">
          <Calendar13 />
        </DemoCard>
        <DemoCard label="p-calendar-14">
          <Calendar14 />
        </DemoCard>
        <DemoCard label="p-calendar-15">
          <Calendar15 />
        </DemoCard>
        <DemoCard label="p-calendar-16">
          <Calendar16 />
        </DemoCard>
        <DemoCard label="p-calendar-17">
          <Calendar17 />
        </DemoCard>
        <DemoCard label="p-calendar-18">
          <Calendar18 />
        </DemoCard>
        <DemoCard label="p-calendar-19">
          <Calendar19 />
        </DemoCard>
        <DemoCard label="p-calendar-20">
          <Calendar20 />
        </DemoCard>
        <DemoCard label="p-calendar-21">
          <Calendar21 />
        </DemoCard>
        <DemoCard label="p-calendar-22">
          <Calendar22 />
        </DemoCard>
        <DemoCard label="p-calendar-23">
          <Calendar23 />
        </DemoCard>
        <DemoCard label="p-calendar-24">
          <Calendar24 />
        </DemoCard>
        <DemoCard label="p-calendar-25">
          <Calendar25 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "card",
    title: "Card",
    desc: "A content container for grouping related information.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-card-1">
          <Card1 />
        </DemoCard>
        <DemoCard label="p-card-2">
          <Card2 />
        </DemoCard>
        <DemoCard label="p-card-3">
          <Card3 />
        </DemoCard>
        <DemoCard label="p-card-4">
          <Card4 />
        </DemoCard>
        <DemoCard label="p-card-5">
          <Card5 />
        </DemoCard>
        <DemoCard label="p-card-6">
          <Card6 />
        </DemoCard>
        <DemoCard label="p-card-7">
          <Card7 />
        </DemoCard>
        <DemoCard label="p-card-8">
          <Card8 />
        </DemoCard>
        <DemoCard label="p-card-9">
          <Card9 />
        </DemoCard>
        <DemoCard label="p-card-10">
          <Card10 />
        </DemoCard>
        <DemoCard label="p-card-11">
          <Card11 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "checkbox",
    title: "Checkbox",
    desc: "A control allowing the user to toggle between checked and not checked.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-checkbox-1">
          <Checkbox1 />
        </DemoCard>
        <DemoCard label="p-checkbox-2">
          <Checkbox2 />
        </DemoCard>
        <DemoCard label="p-checkbox-3">
          <Checkbox3 />
        </DemoCard>
        <DemoCard label="p-checkbox-4">
          <Checkbox4 />
        </DemoCard>
        <DemoCard label="p-checkbox-5">
          <Checkbox5 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "checkbox-group",
    title: "Checkbox Group",
    desc: "Provides shared state to a series of checkboxes.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-checkbox-group-1">
          <CheckboxGroup1 />
        </DemoCard>
        <DemoCard label="p-checkbox-group-2">
          <CheckboxGroup2 />
        </DemoCard>
        <DemoCard label="p-checkbox-group-3">
          <CheckboxGroup3 />
        </DemoCard>
        <DemoCard label="p-checkbox-group-4">
          <CheckboxGroup4 />
        </DemoCard>
        <DemoCard label="p-checkbox-group-5">
          <CheckboxGroup5 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "collapsible",
    title: "Collapsible",
    desc: "A collapsible panel controlled by a button trigger.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-collapsible-1">
          <Collapsible1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "combobox",
    title: "Combobox",
    desc: "An input combined with a list of predefined items to select.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-combobox-1">
          <Combobox1 />
        </DemoCard>
        <DemoCard label="p-combobox-2">
          <Combobox2 />
        </DemoCard>
        <DemoCard label="p-combobox-3">
          <Combobox3 />
        </DemoCard>
        <DemoCard label="p-combobox-4">
          <Combobox4 />
        </DemoCard>
        <DemoCard label="p-combobox-5">
          <Combobox5 />
        </DemoCard>
        <DemoCard label="p-combobox-6">
          <Combobox6 />
        </DemoCard>
        <DemoCard label="p-combobox-7">
          <Combobox7 />
        </DemoCard>
        <DemoCard label="p-combobox-8">
          <Combobox8 />
        </DemoCard>
        <DemoCard label="p-combobox-9">
          <Combobox9 />
        </DemoCard>
        <DemoCard label="p-combobox-10">
          <Combobox10 />
        </DemoCard>
        <DemoCard label="p-combobox-11">
          <Combobox11 />
        </DemoCard>
        <DemoCard label="p-combobox-12">
          <Combobox12 />
        </DemoCard>
        <DemoCard label="p-combobox-13">
          <Combobox13 />
        </DemoCard>
        <DemoCard label="p-combobox-14">
          <Combobox14 />
        </DemoCard>
        <DemoCard label="p-combobox-15">
          <Combobox15 />
        </DemoCard>
        <DemoCard label="p-combobox-16">
          <Combobox16 />
        </DemoCard>
        <DemoCard label="p-combobox-17">
          <Combobox17 />
        </DemoCard>
        <DemoCard label="p-combobox-18">
          <Combobox18 />
        </DemoCard>
        <DemoCard label="p-combobox-19">
          <Combobox19 />
        </DemoCard>
        <DemoCard label="p-combobox-20">
          <Combobox20 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "command",
    title: "Command",
    desc: "A command palette component built with Dialog and Autocomplete for searching and executing commands.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-command-1">
          <Command1 />
        </DemoCard>
        <DemoCard label="p-command-2">
          <Command2 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "context-menu",
    title: "Context Menu",
    desc: "A menu that appears at the pointer on right click or long press.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-context-menu-1">
          <ContextMenu1 />
        </DemoCard>
        <DemoCard label="p-context-menu-2">
          <ContextMenu2 />
        </DemoCard>
        <DemoCard label="p-context-menu-3">
          <ContextMenu3 />
        </DemoCard>
        <DemoCard label="p-context-menu-4">
          <ContextMenu4 />
        </DemoCard>
        <DemoCard label="p-context-menu-5">
          <ContextMenu5 />
        </DemoCard>
        <DemoCard label="p-context-menu-6">
          <ContextMenu6 />
        </DemoCard>
        <DemoCard label="p-context-menu-7">
          <ContextMenu7 />
        </DemoCard>
        <DemoCard label="p-context-menu-8">
          <ContextMenu8 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "date-picker",
    title: "Date Picker",
    desc: "A date picker component built with Calendar and Popover.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-date-picker-1">
          <DatePicker1 />
        </DemoCard>
        <DemoCard label="p-date-picker-2">
          <DatePicker2 />
        </DemoCard>
        <DemoCard label="p-date-picker-3">
          <DatePicker3 />
        </DemoCard>
        <DemoCard label="p-date-picker-4">
          <DatePicker4 />
        </DemoCard>
        <DemoCard label="p-date-picker-5">
          <DatePicker5 />
        </DemoCard>
        <DemoCard label="p-date-picker-6">
          <DatePicker6 />
        </DemoCard>
        <DemoCard label="p-date-picker-7">
          <DatePicker7 />
        </DemoCard>
        <DemoCard label="p-date-picker-8">
          <DatePicker8 />
        </DemoCard>
        <DemoCard label="p-date-picker-9">
          <DatePicker9 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "dialog",
    title: "Dialog",
    desc: "A popup that opens on top of the entire page.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-dialog-1">
          <Dialog1 />
        </DemoCard>
        <DemoCard label="p-dialog-2">
          <Dialog2 />
        </DemoCard>
        <DemoCard label="p-dialog-3">
          <Dialog3 />
        </DemoCard>
        <DemoCard label="p-dialog-4">
          <Dialog4 />
        </DemoCard>
        <DemoCard label="p-dialog-5">
          <Dialog5 />
        </DemoCard>
        <DemoCard label="p-dialog-6">
          <Dialog6 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "drawer",
    title: "Drawer",
    desc: "A panel that slides in from the edge of the screen with swipe gestures, snap points, and nested drawer support.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-drawer-1">
          <Drawer1 />
        </DemoCard>
        <DemoCard label="p-drawer-2">
          <Drawer2 />
        </DemoCard>
        <DemoCard label="p-drawer-3">
          <Drawer3 />
        </DemoCard>
        <DemoCard label="p-drawer-4">
          <Drawer4 />
        </DemoCard>
        <DemoCard label="p-drawer-5">
          <Drawer5 />
        </DemoCard>
        <DemoCard label="p-drawer-6">
          <Drawer6 />
        </DemoCard>
        <DemoCard label="p-drawer-7">
          <Drawer7 />
        </DemoCard>
        <DemoCard label="p-drawer-8">
          <Drawer8 />
        </DemoCard>
        <DemoCard label="p-drawer-9">
          <Drawer9 />
        </DemoCard>
        <DemoCard label="p-drawer-10">
          <Drawer10 />
        </DemoCard>
        <DemoCard label="p-drawer-11">
          <Drawer11 />
        </DemoCard>
        <DemoCard label="p-drawer-12">
          <Drawer12 />
        </DemoCard>
        <DemoCard label="p-drawer-13">
          <Drawer13 />
        </DemoCard>
        <DemoCard label="p-drawer-14">
          <Drawer14 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "empty",
    title: "Empty",
    desc: "A container for displaying empty state information.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-empty-1">
          <Empty1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "field",
    title: "Field",
    desc: "A component that provides labelling and validation for form controls.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-field-1">
          <Field1 />
        </DemoCard>
        <DemoCard label="p-field-2">
          <Field2 />
        </DemoCard>
        <DemoCard label="p-field-3">
          <Field3 />
        </DemoCard>
        <DemoCard label="p-field-4">
          <Field4 />
        </DemoCard>
        <DemoCard label="p-field-5">
          <Field5 />
        </DemoCard>
        <DemoCard label="p-field-6">
          <Field6 />
        </DemoCard>
        <DemoCard label="p-field-7">
          <Field7 />
        </DemoCard>
        <DemoCard label="p-field-8">
          <Field8 />
        </DemoCard>
        <DemoCard label="p-field-9">
          <Field9 />
        </DemoCard>
        <DemoCard label="p-field-10">
          <Field10 />
        </DemoCard>
        <DemoCard label="p-field-11">
          <Field11 />
        </DemoCard>
        <DemoCard label="p-field-12">
          <Field12 />
        </DemoCard>
        <DemoCard label="p-field-13">
          <Field13 />
        </DemoCard>
        <DemoCard label="p-field-14">
          <Field14 />
        </DemoCard>
        <DemoCard label="p-field-15">
          <Field15 />
        </DemoCard>
        <DemoCard label="p-field-16">
          <Field16 />
        </DemoCard>
        <DemoCard label="p-field-17">
          <Field17 />
        </DemoCard>
        <DemoCard label="p-field-18">
          <Field18 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "fieldset",
    title: "Fieldset",
    desc: "A native fieldset element with a legend.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-fieldset-1">
          <Fieldset1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "form",
    title: "Form",
    desc: "A form wrapper component that simplifies validation and submission.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-form-1">
          <Form1 />
        </DemoCard>
        <DemoCard label="p-form-2">
          <Form2 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "frame",
    title: "Frame",
    desc: "A framed container for grouping related information.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-frame-1">
          <Frame1 />
        </DemoCard>
        <DemoCard label="p-frame-2">
          <Frame2 />
        </DemoCard>
        <DemoCard label="p-frame-3">
          <Frame3 />
        </DemoCard>
        <DemoCard label="p-frame-4">
          <Frame4 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "group",
    title: "Group",
    desc: "A component for visually grouping a series of controls.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-group-1">
          <Group1 />
        </DemoCard>
        <DemoCard label="p-group-2">
          <Group2 />
        </DemoCard>
        <DemoCard label="p-group-3">
          <Group3 />
        </DemoCard>
        <DemoCard label="p-group-4">
          <Group4 />
        </DemoCard>
        <DemoCard label="p-group-5">
          <Group5 />
        </DemoCard>
        <DemoCard label="p-group-6">
          <Group6 />
        </DemoCard>
        <DemoCard label="p-group-7">
          <Group7 />
        </DemoCard>
        <DemoCard label="p-group-8">
          <Group8 />
        </DemoCard>
        <DemoCard label="p-group-9">
          <Group9 />
        </DemoCard>
        <DemoCard label="p-group-10">
          <Group10 />
        </DemoCard>
        <DemoCard label="p-group-11">
          <Group11 />
        </DemoCard>
        <DemoCard label="p-group-12">
          <Group12 />
        </DemoCard>
        <DemoCard label="p-group-13">
          <Group13 />
        </DemoCard>
        <DemoCard label="p-group-14">
          <Group14 />
        </DemoCard>
        <DemoCard label="p-group-15">
          <Group15 />
        </DemoCard>
        <DemoCard label="p-group-16">
          <Group16 />
        </DemoCard>
        <DemoCard label="p-group-17">
          <Group17 />
        </DemoCard>
        <DemoCard label="p-group-18">
          <Group18 />
        </DemoCard>
        <DemoCard label="p-group-19">
          <Group19 />
        </DemoCard>
        <DemoCard label="p-group-20">
          <Group20 />
        </DemoCard>
        <DemoCard label="p-group-22">
          <Group22 />
        </DemoCard>
        <DemoCard label="p-group-23">
          <Group23 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "input",
    title: "Input",
    desc: "A native input element.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-input-1">
          <Input1 />
        </DemoCard>
        <DemoCard label="p-input-2">
          <Input2 />
        </DemoCard>
        <DemoCard label="p-input-3">
          <Input3 />
        </DemoCard>
        <DemoCard label="p-input-4">
          <Input4 />
        </DemoCard>
        <DemoCard label="p-input-5">
          <Input5 />
        </DemoCard>
        <DemoCard label="p-input-6">
          <Input6 />
        </DemoCard>
        <DemoCard label="p-input-7">
          <Input7 />
        </DemoCard>
        <DemoCard label="p-input-8">
          <Input8 />
        </DemoCard>
        <DemoCard label="p-input-9">
          <Input9 />
        </DemoCard>
        <DemoCard label="p-input-10">
          <Input10 />
        </DemoCard>
        <DemoCard label="p-input-11">
          <Input11 />
        </DemoCard>
        <DemoCard label="p-input-12">
          <Input12 />
        </DemoCard>
        <DemoCard label="p-input-13">
          <Input13 />
        </DemoCard>
        <DemoCard label="p-input-14">
          <Input14 />
        </DemoCard>
        <DemoCard label="p-input-15">
          <Input15 />
        </DemoCard>
        <DemoCard label="p-input-16">
          <Input16 />
        </DemoCard>
        <DemoCard label="p-input-17">
          <Input17 />
        </DemoCard>
        <DemoCard label="p-input-18">
          <Input18 />
        </DemoCard>
        <DemoCard label="p-input-19">
          <Input19 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "input-group",
    title: "Input Group",
    desc: "A flexible component for grouping inputs with addons, buttons, and other elements.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-input-group-1">
          <InputGroup1 />
        </DemoCard>
        <DemoCard label="p-input-group-2">
          <InputGroup2 />
        </DemoCard>
        <DemoCard label="p-input-group-3">
          <InputGroup3 />
        </DemoCard>
        <DemoCard label="p-input-group-4">
          <InputGroup4 />
        </DemoCard>
        <DemoCard label="p-input-group-5">
          <InputGroup5 />
        </DemoCard>
        <DemoCard label="p-input-group-6">
          <InputGroup6 />
        </DemoCard>
        <DemoCard label="p-input-group-7">
          <InputGroup7 />
        </DemoCard>
        <DemoCard label="p-input-group-8">
          <InputGroup8 />
        </DemoCard>
        <DemoCard label="p-input-group-9">
          <InputGroup9 />
        </DemoCard>
        <DemoCard label="p-input-group-10">
          <InputGroup10 />
        </DemoCard>
        <DemoCard label="p-input-group-11">
          <InputGroup11 />
        </DemoCard>
        <DemoCard label="p-input-group-12">
          <InputGroup12 />
        </DemoCard>
        <DemoCard label="p-input-group-13">
          <InputGroup13 />
        </DemoCard>
        <DemoCard label="p-input-group-14">
          <InputGroup14 />
        </DemoCard>
        <DemoCard label="p-input-group-15">
          <InputGroup15 />
        </DemoCard>
        <DemoCard label="p-input-group-16">
          <InputGroup16 />
        </DemoCard>
        <DemoCard label="p-input-group-17">
          <InputGroup17 />
        </DemoCard>
        <DemoCard label="p-input-group-18">
          <InputGroup18 />
        </DemoCard>
        <DemoCard label="p-input-group-19">
          <InputGroup19 />
        </DemoCard>
        <DemoCard label="p-input-group-20">
          <InputGroup20 />
        </DemoCard>
        <DemoCard label="p-input-group-21">
          <InputGroup21 />
        </DemoCard>
        <DemoCard label="p-input-group-22">
          <InputGroup22 />
        </DemoCard>
        <DemoCard label="p-input-group-23">
          <InputGroup23 />
        </DemoCard>
        <DemoCard label="p-input-group-24">
          <InputGroup24 />
        </DemoCard>
        <DemoCard label="p-input-group-26">
          <InputGroup26 />
        </DemoCard>
        <DemoCard label="p-input-group-27">
          <InputGroup27 />
        </DemoCard>
        <DemoCard label="p-input-group-28">
          <InputGroup28 />
        </DemoCard>
        <DemoCard label="p-input-group-29">
          <InputGroup29 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "kbd",
    title: "Kbd",
    desc: "A component for displaying keyboard keys and shortcuts.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-kbd-1">
          <Kbd1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "menu",
    title: "Menu",
    desc: "A list of actions in a dropdown, enhanced with keyboard navigation.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-menu-1">
          <Menu1 />
        </DemoCard>
        <DemoCard label="p-menu-2">
          <Menu2 />
        </DemoCard>
        <DemoCard label="p-menu-3">
          <Menu3 />
        </DemoCard>
        <DemoCard label="p-menu-4">
          <Menu4 />
        </DemoCard>
        <DemoCard label="p-menu-5">
          <Menu5 />
        </DemoCard>
        <DemoCard label="p-menu-6">
          <Menu6 />
        </DemoCard>
        <DemoCard label="p-menu-7">
          <Menu7 />
        </DemoCard>
        <DemoCard label="p-menu-8">
          <Menu8 />
        </DemoCard>
        <DemoCard label="p-menu-9">
          <Menu9 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "meter",
    title: "Meter",
    desc: "A graphical display of a numeric value within a range.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-meter-1">
          <Meter1 />
        </DemoCard>
        <DemoCard label="p-meter-2">
          <Meter2 />
        </DemoCard>
        <DemoCard label="p-meter-3">
          <Meter3 />
        </DemoCard>
        <DemoCard label="p-meter-4">
          <Meter4 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "number-field",
    title: "Number Field",
    desc: "A numeric input element with increment and decrement buttons, and a scrub area.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-number-field-1">
          <NumberField1 />
        </DemoCard>
        <DemoCard label="p-number-field-2">
          <NumberField2 />
        </DemoCard>
        <DemoCard label="p-number-field-3">
          <NumberField3 />
        </DemoCard>
        <DemoCard label="p-number-field-4">
          <NumberField4 />
        </DemoCard>
        <DemoCard label="p-number-field-5">
          <NumberField5 />
        </DemoCard>
        <DemoCard label="p-number-field-6">
          <NumberField6 />
        </DemoCard>
        <DemoCard label="p-number-field-7">
          <NumberField7 />
        </DemoCard>
        <DemoCard label="p-number-field-8">
          <NumberField8 />
        </DemoCard>
        <DemoCard label="p-number-field-9">
          <NumberField9 />
        </DemoCard>
        <DemoCard label="p-number-field-10">
          <NumberField10 />
        </DemoCard>
        <DemoCard label="p-number-field-11">
          <NumberField11 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "otp-field",
    title: "OTP Field",
    desc: "A segmented input for one-time passwords and verification codes.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-otp-field-1">
          <OtpField1 />
        </DemoCard>
        <DemoCard label="p-otp-field-2">
          <OtpField2 />
        </DemoCard>
        <DemoCard label="p-otp-field-3">
          <OtpField3 />
        </DemoCard>
        <DemoCard label="p-otp-field-4">
          <OtpField4 />
        </DemoCard>
        <DemoCard label="p-otp-field-6">
          <OtpField6 />
        </DemoCard>
        <DemoCard label="p-otp-field-7">
          <OtpField7 />
        </DemoCard>
        <DemoCard label="p-otp-field-8">
          <OtpField8 />
        </DemoCard>
        <DemoCard label="p-otp-field-9">
          <OtpField9 />
        </DemoCard>
        <DemoCard label="p-otp-field-10">
          <OtpField10 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "pagination",
    title: "Pagination",
    desc: "A pagination with page navigation, next and previous links.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-pagination-1">
          <Pagination1 />
        </DemoCard>
        <DemoCard label="p-pagination-2">
          <Pagination2 />
        </DemoCard>
        <DemoCard label="p-pagination-3">
          <Pagination3 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "popover",
    title: "Popover",
    desc: "An accessible popup anchored to a button.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-popover-1">
          <Popover1 />
        </DemoCard>
        <DemoCard label="p-popover-2">
          <Popover2 />
        </DemoCard>
        <DemoCard label="p-popover-3">
          <Popover3 />
        </DemoCard>
        <DemoCard label="p-popover-4">
          <Popover4 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "preview-card",
    title: "Preview Card",
    desc: "A popup that appears when a link is hovered, showing a preview for sighted users.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-preview-card-1">
          <PreviewCard1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "progress",
    title: "Progress",
    desc: "Displays the status of a task that takes a long time.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-progress-1">
          <Progress1 />
        </DemoCard>
        <DemoCard label="p-progress-2">
          <Progress2 />
        </DemoCard>
        <DemoCard label="p-progress-3">
          <Progress3 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "radio-group",
    title: "Radio Group",
    desc: "A set of checkable buttons where no more than one of the buttons can be checked at a time.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-radio-group-1">
          <RadioGroup1 />
        </DemoCard>
        <DemoCard label="p-radio-group-2">
          <RadioGroup2 />
        </DemoCard>
        <DemoCard label="p-radio-group-3">
          <RadioGroup3 />
        </DemoCard>
        <DemoCard label="p-radio-group-4">
          <RadioGroup4 />
        </DemoCard>
        <DemoCard label="p-radio-group-5">
          <RadioGroup5 />
        </DemoCard>
        <DemoCard label="p-radio-group-6">
          <RadioGroup6 />
        </DemoCard>
        <DemoCard label="p-radio-group-7">
          <RadioGroup7 />
        </DemoCard>
        <DemoCard label="p-radio-group-8">
          <RadioGroup8 />
        </DemoCard>
        <DemoCard label="p-radio-group-9">
          <RadioGroup9 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "scroll-area",
    title: "Scroll Area",
    desc: "A native scroll container with custom scrollbars.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-scroll-area-1">
          <ScrollArea1 />
        </DemoCard>
        <DemoCard label="p-scroll-area-2">
          <ScrollArea2 />
        </DemoCard>
        <DemoCard label="p-scroll-area-3">
          <ScrollArea3 />
        </DemoCard>
        <DemoCard label="p-scroll-area-4">
          <ScrollArea4 />
        </DemoCard>
        <DemoCard label="p-scroll-area-5">
          <ScrollArea5 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "select",
    title: "Select",
    desc: "A common form component for choosing a predefined value in a dropdown menu.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-select-1">
          <Select1 />
        </DemoCard>
        <DemoCard label="p-select-2">
          <Select2 />
        </DemoCard>
        <DemoCard label="p-select-3">
          <Select3 />
        </DemoCard>
        <DemoCard label="p-select-4">
          <Select4 />
        </DemoCard>
        <DemoCard label="p-select-5">
          <Select5 />
        </DemoCard>
        <DemoCard label="p-select-6">
          <Select6 />
        </DemoCard>
        <DemoCard label="p-select-7">
          <Select7 />
        </DemoCard>
        <DemoCard label="p-select-8">
          <Select8 />
        </DemoCard>
        <DemoCard label="p-select-9">
          <Select9 />
        </DemoCard>
        <DemoCard label="p-select-10">
          <Select10 />
        </DemoCard>
        <DemoCard label="p-select-11">
          <Select11 />
        </DemoCard>
        <DemoCard label="p-select-12">
          <Select12 />
        </DemoCard>
        <DemoCard label="p-select-13">
          <Select13 />
        </DemoCard>
        <DemoCard label="p-select-14">
          <Select14 />
        </DemoCard>
        <DemoCard label="p-select-15">
          <Select15 />
        </DemoCard>
        <DemoCard label="p-select-16">
          <Select16 />
        </DemoCard>
        <DemoCard label="p-select-17">
          <Select17 />
        </DemoCard>
        <DemoCard label="p-select-18">
          <Select18 />
        </DemoCard>
        <DemoCard label="p-select-19">
          <Select19 />
        </DemoCard>
        <DemoCard label="p-select-20">
          <Select20 />
        </DemoCard>
        <DemoCard label="p-select-21">
          <Select21 />
        </DemoCard>
        <DemoCard label="p-select-22">
          <Select22 />
        </DemoCard>
        <DemoCard label="p-select-23">
          <Select23 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "separator",
    title: "Separator",
    desc: "A separator element accessible to screen readers.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-separator-1">
          <Separator1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "sheet",
    title: "Sheet",
    desc: "A flyout that opens from the side of the screen, based on the dialog component.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-sheet-1">
          <Sheet1 />
        </DemoCard>
        <DemoCard label="p-sheet-2">
          <Sheet2 />
        </DemoCard>
        <DemoCard label="p-sheet-3">
          <Sheet3 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "skeleton",
    title: "Skeleton",
    desc: "A loading state skeleton for your components.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-skeleton-1">
          <Skeleton1 />
        </DemoCard>
        <DemoCard label="p-skeleton-2">
          <Skeleton2 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "slider",
    title: "Slider",
    desc: "An input where the user selects a value from within a given range.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-slider-1">
          <Slider1 />
        </DemoCard>
        <DemoCard label="p-slider-2">
          <Slider2 />
        </DemoCard>
        <DemoCard label="p-slider-3">
          <Slider3 />
        </DemoCard>
        <DemoCard label="p-slider-4">
          <Slider4 />
        </DemoCard>
        <DemoCard label="p-slider-5">
          <Slider5 />
        </DemoCard>
        <DemoCard label="p-slider-6">
          <Slider6 />
        </DemoCard>
        <DemoCard label="p-slider-7">
          <Slider7 />
        </DemoCard>
        <DemoCard label="p-slider-8">
          <Slider8 />
        </DemoCard>
        <DemoCard label="p-slider-9">
          <Slider9 />
        </DemoCard>
        <DemoCard label="p-slider-10">
          <Slider10 />
        </DemoCard>
        <DemoCard label="p-slider-11">
          <Slider11 />
        </DemoCard>
        <DemoCard label="p-slider-12">
          <Slider12 />
        </DemoCard>
        <DemoCard label="p-slider-13">
          <Slider13 />
        </DemoCard>
        <DemoCard label="p-slider-14">
          <Slider14 />
        </DemoCard>
        <DemoCard label="p-slider-15">
          <Slider15 />
        </DemoCard>
        <DemoCard label="p-slider-16">
          <Slider16 />
        </DemoCard>
        <DemoCard label="p-slider-17">
          <Slider17 />
        </DemoCard>
        <DemoCard label="p-slider-18">
          <Slider18 />
        </DemoCard>
        <DemoCard label="p-slider-19">
          <Slider19 />
        </DemoCard>
        <DemoCard label="p-slider-20">
          <Slider20 />
        </DemoCard>
        <DemoCard label="p-slider-21">
          <Slider21 />
        </DemoCard>
        <DemoCard label="p-slider-22">
          <Slider22 />
        </DemoCard>
        <DemoCard label="p-slider-23">
          <Slider23 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "spinner",
    title: "Spinner",
    desc: "An indicator that can be used to show a loading state.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-spinner-1">
          <Spinner1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "switch",
    title: "Switch",
    desc: "A control that indicates whether a setting is on or off.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-switch-1">
          <Switch1 />
        </DemoCard>
        <DemoCard label="p-switch-2">
          <Switch2 />
        </DemoCard>
        <DemoCard label="p-switch-3">
          <Switch3 />
        </DemoCard>
        <DemoCard label="p-switch-4">
          <Switch4 />
        </DemoCard>
        <DemoCard label="p-switch-5">
          <Switch5 />
        </DemoCard>
        <DemoCard label="p-switch-6">
          <Switch6 />
        </DemoCard>
        <DemoCard label="p-switch-7">
          <Switch7 />
        </DemoCard>
        <DemoCard label="p-switch-8">
          <Switch8 />
        </DemoCard>
        <DemoCard label="p-switch-9">
          <Switch9 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "table",
    title: "Table",
    desc: "A simple table component for displaying tabular data.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-table-1">
          <Table1 />
        </DemoCard>
        <DemoCard label="p-table-2">
          <Table2 />
        </DemoCard>
        <DemoCard label="p-table-3">
          <Table3 />
        </DemoCard>
        <DemoCard label="p-table-4">
          <Table4 />
        </DemoCard>
        <DemoCard label="p-table-5">
          <Table5 />
        </DemoCard>
        <DemoCard label="p-table-6">
          <Table6 />
        </DemoCard>
        <DemoCard label="p-table-7">
          <Table7 />
        </DemoCard>
        <DemoCard label="p-table-8">
          <Table8 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "tabs",
    title: "Tabs",
    desc: "A component for toggling between related panels on the same page.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-tabs-1">
          <Tabs1 />
        </DemoCard>
        <DemoCard label="p-tabs-2">
          <Tabs2 />
        </DemoCard>
        <DemoCard label="p-tabs-3">
          <Tabs3 />
        </DemoCard>
        <DemoCard label="p-tabs-4">
          <Tabs4 />
        </DemoCard>
        <DemoCard label="p-tabs-5">
          <Tabs5 />
        </DemoCard>
        <DemoCard label="p-tabs-6">
          <Tabs6 />
        </DemoCard>
        <DemoCard label="p-tabs-7">
          <Tabs7 />
        </DemoCard>
        <DemoCard label="p-tabs-8">
          <Tabs8 />
        </DemoCard>
        <DemoCard label="p-tabs-9">
          <Tabs9 />
        </DemoCard>
        <DemoCard label="p-tabs-10">
          <Tabs10 />
        </DemoCard>
        <DemoCard label="p-tabs-11">
          <Tabs11 />
        </DemoCard>
        <DemoCard label="p-tabs-12">
          <Tabs12 />
        </DemoCard>
        <DemoCard label="p-tabs-13">
          <Tabs13 />
        </DemoCard>
        <DemoCard label="p-tabs-14">
          <Tabs14 />
        </DemoCard>
        <DemoCard label="p-tabs-15">
          <Tabs15 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "textarea",
    title: "Textarea",
    desc: "A native textarea element.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-textarea-1">
          <Textarea1 />
        </DemoCard>
        <DemoCard label="p-textarea-2">
          <Textarea2 />
        </DemoCard>
        <DemoCard label="p-textarea-3">
          <Textarea3 />
        </DemoCard>
        <DemoCard label="p-textarea-4">
          <Textarea4 />
        </DemoCard>
        <DemoCard label="p-textarea-5">
          <Textarea5 />
        </DemoCard>
        <DemoCard label="p-textarea-6">
          <Textarea6 />
        </DemoCard>
        <DemoCard label="p-textarea-7">
          <Textarea7 />
        </DemoCard>
        <DemoCard label="p-textarea-8">
          <Textarea8 />
        </DemoCard>
        <DemoCard label="p-textarea-9">
          <Textarea9 />
        </DemoCard>
        <DemoCard label="p-textarea-10">
          <Textarea10 />
        </DemoCard>
        <DemoCard label="p-textarea-11">
          <Textarea11 />
        </DemoCard>
        <DemoCard label="p-textarea-12">
          <Textarea12 />
        </DemoCard>
        <DemoCard label="p-textarea-13">
          <Textarea13 />
        </DemoCard>
        <DemoCard label="p-textarea-14">
          <Textarea14 />
        </DemoCard>
        <DemoCard label="p-textarea-15">
          <Textarea15 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "toast",
    title: "Toast",
    desc: "A temporary notification that appears on screen to inform users.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-toast-1">
          <Toast1 />
        </DemoCard>
        <DemoCard label="p-toast-2">
          <Toast2 />
        </DemoCard>
        <DemoCard label="p-toast-3">
          <Toast3 />
        </DemoCard>
        <DemoCard label="p-toast-4">
          <Toast4 />
        </DemoCard>
        <DemoCard label="p-toast-5">
          <Toast5 />
        </DemoCard>
        <DemoCard label="p-toast-6">
          <Toast6 />
        </DemoCard>
        <DemoCard label="p-toast-7">
          <Toast7 />
        </DemoCard>
        <DemoCard label="p-toast-8">
          <Toast8 />
        </DemoCard>
        <DemoCard label="p-toast-9">
          <Toast9 />
        </DemoCard>
        <DemoCard label="p-toast-10">
          <Toast10 />
        </DemoCard>
        <DemoCard label="p-toast-11">
          <Toast11 />
        </DemoCard>
        <DemoCard label="p-toast-12">
          <Toast12 />
        </DemoCard>
        <DemoCard label="p-toast-13">
          <Toast13 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "toggle",
    title: "Toggle",
    desc: "A two-state button that can be toggled on or off.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-toggle-1">
          <Toggle1 />
        </DemoCard>
        <DemoCard label="p-toggle-2">
          <Toggle2 />
        </DemoCard>
        <DemoCard label="p-toggle-3">
          <Toggle3 />
        </DemoCard>
        <DemoCard label="p-toggle-4">
          <Toggle4 />
        </DemoCard>
        <DemoCard label="p-toggle-5">
          <Toggle5 />
        </DemoCard>
        <DemoCard label="p-toggle-6">
          <Toggle6 />
        </DemoCard>
        <DemoCard label="p-toggle-7">
          <Toggle7 />
        </DemoCard>
        <DemoCard label="p-toggle-8">
          <Toggle8 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "toggle-group",
    title: "Toggle Group",
    desc: "Provides a shared state to a series of toggle buttons.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-toggle-group-1">
          <ToggleGroup1 />
        </DemoCard>
        <DemoCard label="p-toggle-group-2">
          <ToggleGroup2 />
        </DemoCard>
        <DemoCard label="p-toggle-group-3">
          <ToggleGroup3 />
        </DemoCard>
        <DemoCard label="p-toggle-group-4">
          <ToggleGroup4 />
        </DemoCard>
        <DemoCard label="p-toggle-group-5">
          <ToggleGroup5 />
        </DemoCard>
        <DemoCard label="p-toggle-group-6">
          <ToggleGroup6 />
        </DemoCard>
        <DemoCard label="p-toggle-group-7">
          <ToggleGroup7 />
        </DemoCard>
        <DemoCard label="p-toggle-group-8">
          <ToggleGroup8 />
        </DemoCard>
        <DemoCard label="p-toggle-group-9">
          <ToggleGroup9 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "toolbar",
    title: "Toolbar",
    desc: "A container for grouping a set of buttons and controls.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-toolbar-1">
          <Toolbar1 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "tooltip",
    title: "Tooltip",
    desc: "A popup that appears when an element is hovered or focused, showing a hint for sighted users.",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-tooltip-1">
          <Tooltip1 />
        </DemoCard>
        <DemoCard label="p-tooltip-2">
          <Tooltip2 />
        </DemoCard>
        <DemoCard label="p-tooltip-3">
          <Tooltip3 />
        </DemoCard>
        <DemoCard label="p-tooltip-4">
          <Tooltip4 />
        </DemoCard>
      </div>
    ),
  },
  {
    id: "segmented-control",
    title: "Segmented Control",
    desc: "Visual pattern using radio-group and navigation primitives",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <DemoCard label="p-radio-group-7">
          <RadioGroup7 />
        </DemoCard>
        <DemoCard label="p-radio-group-8">
          <RadioGroup8 />
        </DemoCard>
        <DemoCard label="p-radio-group-9">
          <RadioGroup9 />
        </DemoCard>
        <DemoCard label="p-navigation-1">
          <Navigation1 />
        </DemoCard>
        <DemoCard label="p-navigation-2">
          <Navigation2 />
        </DemoCard>
        <DemoCard label="p-navigation-3">
          <Navigation3 />
        </DemoCard>
      </div>
    ),
  },
]

const INITIAL_COUNT = 3
const LOAD_STEP = 2

function RouteComponent() {
  const [visibleCount, setVisibleCount] = React.useState(() => {
    const hash =
      typeof globalThis.location !== "undefined"
        ? globalThis.location.hash.slice(1)
        : ""
    if (!hash) return INITIAL_COUNT
    const idx = SECTIONS.findIndex((s) => s.id === hash)
    return idx !== -1 ? Math.max(INITIAL_COUNT, idx + 1) : INITIAL_COUNT
  })
  const [activeId, setActiveId] = React.useState(SECTIONS[0]?.id ?? "")
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // autoload next "pages" when sentinel near viewport
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting)
          setVisibleCount((c) => Math.min(c + LOAD_STEP, SECTIONS.length))
      },
      { rootMargin: "800px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visibleCount])

  // sidebar active tracking
  React.useEffect(() => {
    const observers: IntersectionObserver[] = []
    for (const s of SECTIONS.slice(0, visibleCount)) {
      const el = document.getElementById(s.id)
      if (!el) continue
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) setActiveId(s.id)
        },
        { rootMargin: "-30% 0px -65% 0px" },
      )
      io.observe(el)
      observers.push(io)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [visibleCount])

  const handleNavClick = (id: string) => {
    const idx = SECTIONS.findIndex((s) => s.id === id)
    if (idx === -1) return
    if (idx >= visibleCount) setVisibleCount(idx + 1)
    // wait a tick for DOM to mount, then scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
        history.replaceState(null, "", `#${id}`)
        setActiveId(id)
      }, 30)
    })
  }

  const visible = SECTIONS.slice(0, visibleCount)
  const allLoaded = visibleCount >= SECTIONS.length

  return (
    <ToastProvider>
      <div className="bg-background text-foreground min-h-screen">
        <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
            <div>
              <h1 className="text-lg font-semibold">
                Tailwind UI — COSS Complete Preview
              </h1>
              <p className="text-muted-foreground text-xs">
                {SECTIONS.length} components • {visibleCount}/{SECTIONS.length}{" "}
                loaded • autoload on scroll
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleNavClick(SECTIONS[0].id)}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Jump to top
            </button>
          </div>
        </header>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[210px_1fr]">
          <nav className="hidden h-fit lg:sticky lg:top-16.25 lg:block">
            <div className="bg-card rounded-xl border p-3">
              <div className="mb-2 text-xs font-semibold tracking-widest uppercase opacity-60">
                Components
              </div>
              <div className="flex max-h-[calc(100vh-120px)] flex-col gap-0.5 overflow-auto">
                {SECTIONS.map((s) => {
                  const loaded =
                    SECTIONS.findIndex((x) => x.id === s.id) < visibleCount
                  const isActive = s.id === activeId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleNavClick(s.id)}
                      className={
                        isActive
                          ? "bg-accent text-accent-foreground rounded-md px-2 py-1 text-left text-sm capitalize"
                          : "hover:bg-accent rounded-md px-2 py-1 text-left text-sm capitalize"
                      }
                      title={loaded ? s.title : `${s.title} (click to load)`}
                    >
                      <span className={loaded ? "" : "opacity-60"}>
                        {s.id.replaceAll("-", " ")}
                      </span>
                      {!loaded ? (
                        <span className="ml-1 opacity-40">·</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <div className="text-muted-foreground mt-3 border-t pt-2 text-[11px]">
                {visibleCount}/{SECTIONS.length} pages loaded
              </div>
            </div>
          </nav>
          <div className="flex flex-col gap-6">
            {visible.map((s) => (
              <Section key={s.id} id={s.id} title={s.title} desc={s.desc}>
                {s.content}
              </Section>
            ))}
            <div
              ref={sentinelRef}
              className="flex flex-col items-center gap-3 py-6"
            >
              {!allLoaded ? (
                <>
                  <div className="text-muted-foreground text-sm">
                    Loading next components…
                  </div>
                  <div className="bg-muted h-1 w-40 overflow-hidden rounded-full">
                    <div
                      className="bg-foreground h-full transition-all"
                      style={{
                        width: `${(visibleCount / SECTIONS.length) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((c) =>
                        Math.min(c + LOAD_STEP, SECTIONS.length),
                      )
                    }
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Load more ({SECTIONS.length - visibleCount} remaining)
                  </button>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  All {SECTIONS.length} components loaded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
