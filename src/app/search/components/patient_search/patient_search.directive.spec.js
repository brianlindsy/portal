(function () {
    'use strict';

    describe('search.aiPatientSearch', function () {
        var $compile, $rootScope, vm, el, $log, $q, commonService, mock;
        mock = {patientSearch: {results: [{id:2, givenName: 'Joe', familyName: 'Rogan'}, {id:3, givenName: 'Sue', familyName: 'Samson'}]}};
        mock.badRequest = {
            status:400,
            error:'Bad Request',
            message:'One of the following search parameters was blank or improperly formed: Name, Date of Birth, Gender'
        };
        mock.dob = {
            year: '1999',
            month: '03',
            day: '19'
        };
        mock.query = {}
        mock.query.patientNames = [{
            givenName: ['bob'],
            familyName: 'jones',
            nameType: {code: 'L'}
        }];
        mock.query.dob = mock.dob;
        mock.query.gender = 'M';

        beforeEach(function () {
            module('portal', function ($provide) {
                $provide.decorator('commonService', function ($delegate) {
                    $delegate.searchForPatient = jasmine.createSpy('commonService.searchForPatient');
                    return $delegate;
                });
            });
            inject(function (_$compile_, _$rootScope_, _$log_, _$q_, _commonService_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $log = _$log_;
                $q = _$q_;
                commonService = _commonService_;
                commonService.searchForPatient.and.returnValue($q.when(mock.patientSearch));

                el = angular.element('<ai-patient-search></ai-patient-search>');

                $compile(el)($rootScope.$new());
                $rootScope.$digest();
                vm = el.isolateScope().vm;

                vm.queryForm = {
                    $error: { required: [1, 2], invalid: [3], notAnError: 4 },
                    $setDirty: function () {
                        this.$dirty = true;
                        this.$pristine = false;
                    },
                    $setPristine: function () { this.$pristine = true; },
                    $setUntouched: function () { this.$untouched = true; }
                };
                vm.query = { };
                vm.query.patientNames = [{givenName: [''], nameType: { code: 'L', description: 'Legal Name'} }];
                vm.query.dob = {};
                vm.query.dob.month = '';
                vm.query.dob.day = '';
                vm.query.dob.year = '';
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                //console.debug("\n Debug: " + $log.debug.logs.join("\n Debug: "));
            }
        });

        it('should be compiled', function () {
            expect(el.html()).not.toEqual(null);
        });

        it('should have isolate scope object with instanciate members', function () {
            expect(vm).toEqual(jasmine.any(Object));
        });

        it('should know how many errors the queryForm has', function () {
            expect(vm.errorCount()).toBe(3);
        });

        it('should have a function to query for patients', function () {
            expect(vm.searchForPatient).toBeDefined();
        });
        
        it('should populate the patientNames ', function () {
            expect(vm.query.patientNames).toBeDefined();
        });
        
        it('should populate the dob object', function () {
            expect(vm.query.dob).toBeDefined();
            expect(vm.query.dob.month).toBeDefined();
            expect(vm.query.dob.day).toBeDefined();
        });

        describe('submitting the search form', function () {
            beforeEach(function () {
                vm.query = angular.copy(mock.query);
                vm.queryForm.$setDirty();
            });

            it('should call commonService.searchForPatient on query', function () {
                vm.searchForPatient();
                expect(commonService.searchForPatient).toHaveBeenCalled();
            });

            it('should clear the query fields on a search', function () {
                vm.searchForPatient();
                expect(vm.query).toEqual({patientNames: [{givenName: [''], nameType: {code: 'L'}}]});
            });

            it('should wipe the form on a search', function () {
                vm.searchForPatient();
                expect(vm.queryForm.$pristine).toBe(true);
            });

            it('should hide errors on a search', function () {
                vm.searchForPatient();
                expect(vm.showFormErrors).toBe(false);
            });

            it('should set the addresses to blank on a search', function () {
                vm.query.addresses = [{},{}];
                vm.searchForPatient();
                expect(vm.query.addresses).toBeUndefined();
            });

            it('should tell the controller that a search was performed', function () {
                spyOn(vm,'triggerHandlers');
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.triggerHandlers).toHaveBeenCalled();
            });

            it('should compile the date of birth fields on search', function () {
                var compiled = angular.copy(vm.query);
                compiled.dob = '19990319'
                vm.searchForPatient();
                expect(commonService.searchForPatient).toHaveBeenCalledWith(compiled);
            });

            it('should have a way to assemble the DOB', function () {
                expect(vm.assembledDob()).toBe('19990319');
            });

            it('should show an error if the search is bad', function () {
                commonService.searchForPatient.and.returnValue($q.reject({data: mock.badRequest}));
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.errorMessage).toBe(mock.badRequest.message);
            });
        });

        it('should not let a search be performed without required parameters', function () {
            vm.query = {};
            vm.queryForm.$invalid = true;
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.queryForm.$setDirty();
            vm.query = { givenName: 'fake' };
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.query.familyName =  'last';
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.query.dob = {};
            vm.query.dob.year = mock.dob.year;
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.query.dob.month = mock.dob.month;
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.query.dob.day = mock.dob.day;
            vm.searchForPatient();
            expect(commonService.searchForPatient).not.toHaveBeenCalled();
            vm.query.gender= 'M' ;
            vm.queryForm.$invalid = false;
            vm.searchForPatient();
            expect(commonService.searchForPatient).toHaveBeenCalled();
        });
    });
})();
