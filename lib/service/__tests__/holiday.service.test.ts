import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HolidayService } from '../holiday.service';
import { holidayController } from '../../controllers/holiday.controller';
import { HolidayType } from '@prisma/client';

// Mock the holiday controller
vi.mock('../../controllers/holiday.controller', () => ({
  holidayController: {
    findTemplateWithHolidays: vi.fn(),
    checkTemplateNameExists: vi.fn(),
    createFullHolidayTemplate: vi.fn(),
    createFullHoliday: vi.fn(),
    findHolidayByDateAndType: vi.fn(),
    findRecurringHolidayByDatePattern: vi.fn(),
  },
}));

describe('HolidayService', () => {
  let holidayService: HolidayService;

  beforeEach(() => {
    holidayService = new HolidayService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('copyHolidaysFromTemplate', () => {
    const mockSourceTemplate = {
      id: 'source-template-id',
      name: 'Philippine Holidays 2026',
      description: 'Default holiday template',
      organizationId: 'system-org-id',
      isDefault: true,
      holidays: [
        {
          id: 'holiday-1',
          name: 'New Year\'s Day',
          date: new Date('2026-01-01'),
          type: HolidayType.REGULAR,
          rateMultiplier: 2.0,
          isPaidIfNotWorked: true,
          countsTowardOt: false,
          isRecurring: false,
        },
        {
          id: 'holiday-2',
          name: 'Chinese Lunar New Year',
          date: new Date('2026-02-17'),
          type: HolidayType.SPECIAL_NON_WORKING,
          rateMultiplier: 1.3,
          isPaidIfNotWorked: false,
          countsTowardOt: true,
          isRecurring: false,
        },
      ],
    };

    const mockNewTemplate = {
      id: 'new-template-id',
      name: 'My Organization Holidays 2026',
      description: 'Copied from Philippine Holidays 2026',
      isDefault: false,
    };

    const mockNewHolidays = [
      {
        id: 'new-holiday-1',
        name: 'New Year\'s Day',
        date: new Date('2026-01-01'),
        type: HolidayType.REGULAR,
        rateMultiplier: 2.0,
        isPaidIfNotWorked: true,
        countsTowardOt: false,
      },
      {
        id: 'new-holiday-2',
        name: 'Chinese Lunar New Year',
        date: new Date('2026-02-17'),
        type: HolidayType.SPECIAL_NON_WORKING,
        rateMultiplier: 1.3,
        isPaidIfNotWorked: false,
        countsTowardOt: true,
      },
    ];

    it('should successfully copy holidays from template without year adjustment', async () => {
      // Arrange
      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'source-template-id',
        newTemplateName: 'My Organization Holidays 2026',
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(mockSourceTemplate);
      vi.mocked(holidayController.checkTemplateNameExists).mockResolvedValue(false);
      vi.mocked(holidayController.createFullHolidayTemplate).mockResolvedValue(mockNewTemplate);
      vi.mocked(holidayController.createFullHoliday)
        .mockResolvedValueOnce(mockNewHolidays[0])
        .mockResolvedValueOnce(mockNewHolidays[1]);

      // Act
      const result = await holidayService.copyHolidaysFromTemplate(input);

      // Assert
      expect(holidayController.findTemplateWithHolidays).toHaveBeenCalledWith('source-template-id');
      expect(holidayController.checkTemplateNameExists).toHaveBeenCalledWith('org-123', 'My Organization Holidays 2026');
      expect(holidayController.createFullHolidayTemplate).toHaveBeenCalledWith({
        organizationId: 'org-123',
        name: 'My Organization Holidays 2026',
        description: 'Copied from Philippine Holidays 2026',
        isDefault: false,
      });
      expect(holidayController.createFullHoliday).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        template: {
          id: 'new-template-id',
          name: 'My Organization Holidays 2026',
          description: 'Copied from Philippine Holidays 2026',
          isDefault: false,
        },
        holidays: [
          {
            id: 'new-holiday-1',
            name: 'New Year\'s Day',
            date: '2026-01-01',
            type: HolidayType.REGULAR,
            rateMultiplier: 2.0,
            isPaidIfNotWorked: true,
            countsTowardOt: false,
          },
          {
            id: 'new-holiday-2',
            name: 'Chinese Lunar New Year',
            date: '2026-02-17',
            type: HolidayType.SPECIAL_NON_WORKING,
            rateMultiplier: 1.3,
            isPaidIfNotWorked: false,
            countsTowardOt: true,
          },
        ],
        totalCopied: 2,
      });
    });

    it('should successfully copy holidays from template with year adjustment', async () => {
      // Arrange
      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'source-template-id',
        newTemplateName: 'My Organization Holidays 2025',
        targetYear: 2025,
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(mockSourceTemplate);
      vi.mocked(holidayController.checkTemplateNameExists).mockResolvedValue(false);
      vi.mocked(holidayController.createFullHolidayTemplate).mockResolvedValue({
        ...mockNewTemplate,
        name: 'My Organization Holidays 2025',
      });

      // Mock holidays with adjusted dates
      const adjustedHolidays = [
        {
          ...mockNewHolidays[0],
          date: new Date('2025-01-01'), // Year adjusted
        },
        {
          ...mockNewHolidays[1],
          date: new Date('2025-02-17'), // Year adjusted
        },
      ];

      vi.mocked(holidayController.createFullHoliday)
        .mockResolvedValueOnce(adjustedHolidays[0])
        .mockResolvedValueOnce(adjustedHolidays[1]);

      // Act
      const result = await holidayService.copyHolidaysFromTemplate(input);

      // Assert
      expect(holidayController.createFullHoliday).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date('2025-01-01'),
        })
      );
      expect(holidayController.createFullHoliday).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date('2025-02-17'),
        })
      );

      expect(result.holidays[0].date).toBe('2025-01-01');
      expect(result.holidays[1].date).toBe('2025-02-17');
    });

    it('should throw error when source template is not found', async () => {
      // Arrange
      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'non-existent-template',
        newTemplateName: 'My Organization Holidays',
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(null);

      // Act & Assert
      await expect(holidayService.copyHolidaysFromTemplate(input)).rejects.toThrow('Source template not found');
    });

    it('should throw error when template name already exists', async () => {
      // Arrange
      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'source-template-id',
        newTemplateName: 'Existing Template Name',
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(mockSourceTemplate);
      vi.mocked(holidayController.checkTemplateNameExists).mockResolvedValue(true);

      // Act & Assert
      await expect(holidayService.copyHolidaysFromTemplate(input)).rejects.toThrow(
        'A template with this name already exists for your organization'
      );
    });

    it('should handle empty holidays array', async () => {
      // Arrange
      const emptyTemplate = {
        ...mockSourceTemplate,
        holidays: [],
      };

      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'empty-template-id',
        newTemplateName: 'Empty Template Copy',
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(emptyTemplate);
      vi.mocked(holidayController.checkTemplateNameExists).mockResolvedValue(false);
      vi.mocked(holidayController.createFullHolidayTemplate).mockResolvedValue(mockNewTemplate);

      // Act
      const result = await holidayService.copyHolidaysFromTemplate(input);

      // Assert
      expect(holidayController.createFullHoliday).not.toHaveBeenCalled();
      expect(result.totalCopied).toBe(0);
      expect(result.holidays).toEqual([]);
    });

    it('should preserve all holiday properties during copying', async () => {
      // Arrange
      const complexHoliday = {
        id: 'complex-holiday',
        name: 'Complex Holiday',
        date: new Date('2026-12-25'),
        type: HolidayType.REGULAR,
        rateMultiplier: 3.0,
        isPaidIfNotWorked: true,
        countsTowardOt: true,
        isRecurring: true,
      };

      const complexTemplate = {
        ...mockSourceTemplate,
        holidays: [complexHoliday],
      };

      const input = {
        organizationId: 'org-123',
        sourceTemplateId: 'complex-template-id',
        newTemplateName: 'Complex Template Copy',
      };

      vi.mocked(holidayController.findTemplateWithHolidays).mockResolvedValue(complexTemplate);
      vi.mocked(holidayController.checkTemplateNameExists).mockResolvedValue(false);
      vi.mocked(holidayController.createFullHolidayTemplate).mockResolvedValue(mockNewTemplate);
      vi.mocked(holidayController.createFullHoliday).mockResolvedValue({
        ...complexHoliday,
        id: 'new-complex-holiday',
      });

      // Act
      const result = await holidayService.copyHolidaysFromTemplate(input);

      // Assert
      expect(holidayController.createFullHoliday).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complex Holiday',
          type: HolidayType.REGULAR,
          rateMultiplier: 3.0,
          isPaidIfNotWorked: true,
          countsTowardOt: true,
          isRecurring: true,
        })
      );

      expect(result.holidays[0]).toEqual(
        expect.objectContaining({
          name: 'Complex Holiday',
          type: HolidayType.REGULAR,
          rateMultiplier: 3.0,
          isPaidIfNotWorked: true,
          countsTowardOt: true,
        })
      );
    });
  });

  describe('canClockIn', () => {
    it('should allow clocking in when no holiday restrictions apply', async () => {
      // Arrange
      const organizationId = 'org-123';
      const workDate = new Date('2026-03-15'); // Regular workday

      vi.mocked(holidayController.findHolidayByDateAndType).mockResolvedValue(null);
      vi.mocked(holidayController.findRecurringHolidayByDatePattern).mockResolvedValue(null);

      // Act
      const result = await holidayService.canClockIn(organizationId, workDate);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should prevent clocking in on regular holiday', async () => {
      // Arrange
      const organizationId = 'org-123';
      const workDate = new Date('2026-01-01'); // New Year's Day

      const mockHoliday = {
        id: 'holiday-1',
        type: HolidayType.REGULAR,
        date: workDate,
      };

      vi.mocked(holidayController.findHolidayByDateAndType).mockResolvedValue(mockHoliday);

      // Act
      const result = await holidayService.canClockIn(organizationId, workDate);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not allowed on REGULAR holiday');
    });

    it('should allow clocking in on working holiday', async () => {
      // Arrange
      const organizationId = 'org-123';
      const workDate = new Date('2026-04-09'); // Working holiday

      vi.mocked(holidayController.findHolidayByDateAndType).mockResolvedValue(null);
      vi.mocked(holidayController.findRecurringHolidayByDatePattern).mockResolvedValue(null);

      // Act
      const result = await holidayService.canClockIn(organizationId, workDate);

      // Assert
      expect(result.allowed).toBe(true);
    });
  });
});
